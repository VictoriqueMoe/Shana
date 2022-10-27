import {delay, inject, injectable} from "tsyringe";
import {TimedSet} from "@discordx/utilities";
import {ObjectUtil} from "../../../utils/Utils.js";
import {BaseGuildTextChannel, EmbedBuilder, GuildMember, Message} from "discord.js";
import {MessageListenerDecorator} from "../../../model/framework/decorators/MessageListenerDecorator.js";
import {notBot} from "../../../guards/managedGuards/NotABot.js";
import {ArgsOf, Client} from "discordx";
import ACTION from "../../../enums/ACTION.js";
import TIME_OUT from "../../../enums/TIME_OUT.js";
import {Enabled} from "../../../guards/managedGuards/Enabled.js";
import Immutable from "immutable";
import {TriggerConstraint} from "../../../model/closeableModules/impl/TriggerConstraint.js";
import type {IAutoModFilter} from "../../../model/closeableModules/subModules/autoMod/filters/IAutoModFilter.js";
import {EventDeletedListener} from "../../djxManaged/eventDispatcher/EventDeletedListener.js";
import {MuteManager} from "../../../model/framework/manager/MuteManager.js";
import {LogChannelManager} from "../../../model/framework/manager/LogChannelManager.js";
import TIME_UNIT from "../../../enums/TIME_UNIT.js";
import {FilterModuleManager} from "../../../model/framework/manager/FilterModuleManager.js";
import logger from "../../../utils/LoggerFactory.js";

@injectable()
export class AutoMod extends TriggerConstraint<null> {

    private readonly _muteTimeoutArray: Map<string, Map<IAutoModFilter, TimedSet<TerminalViolation>>> = new Map();

    public constructor(private _client?: Client,
                       private _muteManager?: MuteManager,
                       private _logManager?: LogChannelManager,
                       @inject(delay(() => FilterModuleManager)) private _filterModuleManager?: FilterModuleManager) {
        super();
    }

    public override get submodules(): Immutable.Set<IAutoModFilter> {
        return super.submodules as Immutable.Set<IAutoModFilter>;
    }


    public setDefaults(): Promise<void> {
        return Promise.resolve();
    }

    private postToLog(filters: IAutoModFilter[], message: Message): Promise<Message | null> {
        const guildId = message.guildId;
        const member = message.member;
        const avatarUrl = member.user.displayAvatarURL({size: 1024});
        const channel = message.channel;
        const messageContent = message.content;
        const filtersFailed = filters.map(filter => `• ${filter.id}`).join("\n");
        const embed = new EmbedBuilder()
            .setColor(member.roles.highest.hexColor)
            .setAuthor({
                url: avatarUrl,
                name: member.user.tag
            })
            .setThumbnail(avatarUrl)
            .setTimestamp()
            .setDescription(`**Message sent by <@${member.id}> deleted in <#${channel.id}>**`)
            .setFooter({
                text: `${member.user.id}`
            });
        embed.addFields([
            {
                name: "message content:",
                value: messageContent
            },
            {
                name: "failed filters:",
                value: filtersFailed
            }
        ]);
        return this._logManager.postToLog([embed], guildId, false);
    }

    private async muteUser(violationObj: TerminalViolation, user: GuildMember, reason: string, channel?: BaseGuildTextChannel, time?: number): Promise<GuildMember> {
        if (!user) {
            return;
        }
        if (this._muteManager.isMuted(user)) {
            return;
        }
        if (!time) {
            time = TIME_OUT["1 hour"];
        }
        const guildId = user.guild.id;
        const model = await this._muteManager.muteUser(user, reason, time * 1000);
        this._muteTimeoutArray.get(guildId).get(violationObj.filter).delete(violationObj);
        if (model) {
            const humanMuted = ObjectUtil.timeToHuman(time, TIME_UNIT.seconds);
            await this._logManager.postToLog(`User: "${user.user.username}" has been muted for the reason: "${reason}" by module: \`"${violationObj.filter.id}"\` for ${humanMuted}`, user.guild.id);
            if (channel) {
                await channel.send(`<@${user.id}>, you have been muted for ${humanMuted} due to the violation of the \`${violationObj.filter.id}\``);
            }
        }
        return model;
    }

    @MessageListenerDecorator(true, [notBot, Enabled(AutoMod)])
    private async process([message]: ArgsOf<"messageCreate">): Promise<void> {
        const filters = this.submodules;
        let violatedFilters: IAutoModFilter[] = [];
        if (!message.member) {
            return;
        }
        const guildId = message.guildId;
        const member = message.member;
        const userId = member.id;
        for (const filter of filters) {
            if (!(await filter.isActive(guildId))) {
                continue;
            }
            if (this._muteTimeoutArray.has(guildId)) {
                if (!this._muteTimeoutArray.get(guildId).has(filter)) {
                    const timeout = await filter.terminalViolationTimeout(guildId);
                    const timedSet = new TimedSet<TerminalViolation>(timeout * 1000);
                    this._muteTimeoutArray.get(guildId).set(filter, timedSet);
                }
            } else {
                const timeout = await filter.terminalViolationTimeout(guildId);
                const timedSet = new TimedSet<TerminalViolation>(timeout * 1000);
                const newMap: Map<IAutoModFilter, TimedSet<TerminalViolation>> = new Map();
                newMap.set(filter, timedSet);
                this._muteTimeoutArray.set(guildId, newMap);
            }

            const filterConstraintSettings = await this._filterModuleManager.getModel(message.guildId, filter);
            if (!super.canTrigger(filterConstraintSettings, message)) {
                continue;
            }
            // check if can trigger here based on filter options
            const didPassFilter = await filter.doFilter(message);
            if (!didPassFilter) {
                violatedFilters.push(filter);
            }
        }
        if (!ObjectUtil.isValidArray(violatedFilters)) {
            return;
        }
        const priorityFilters = violatedFilters.map(filter => {
            return filter.priority(guildId).then(priority => {
                return {
                    priority,
                    filter
                };
            });
        });
        const results = await Promise.all(priorityFilters);
        results.sort((a, b) => a.priority - b.priority);
        violatedFilters = [...results.map(v => v.filter)];
        const {channel} = message;
        outer:
            for (const filter of violatedFilters) {
                const actionsToTake = await filter.actions(guildId);
                let didPreformTerminalOperation = false;
                for (const action of actionsToTake) {
                    switch (action) {
                        case ACTION.BAN:
                        case ACTION.KICK:
                        case ACTION.MUTE: {
                            if (action === ACTION.MUTE && this._muteManager.isMuted(member)) {
                                continue;
                            }
                            let fromArray = this.getFromArray(userId, guildId, filter);
                            if (fromArray) {
                                fromArray.violations++;
                                this._muteTimeoutArray.get(guildId).get(filter).refresh(fromArray);
                            } else {
                                fromArray = new TerminalViolation(userId, filter);
                                this._muteTimeoutArray.get(guildId).get(filter).add(fromArray);
                            }
                            if (await fromArray.hasViolationLimitReached(guildId)) {
                                try {
                                    switch (action) {
                                        case ACTION.KICK:
                                            await member.kick(`Auto mod violation limit reached \`${fromArray.filter.id}\``);
                                            break;
                                        case ACTION.BAN:
                                            await member.ban({
                                                reason: `Auto mod violation limit reached \`${fromArray.filter.id}\``,
                                                deleteMessageDays: 1
                                            });
                                            break;
                                        case ACTION.MUTE: {
                                            let textChannel: BaseGuildTextChannel = null;
                                            const channel = message.channel;
                                            if (channel instanceof BaseGuildTextChannel) {
                                                textChannel = channel;
                                            }
                                            const autoMuteTimeout = await filter.autoMuteTimeout(guildId);
                                            await this.muteUser(fromArray, member, "Auto mod violation limit reached", textChannel, autoMuteTimeout);
                                            break;
                                        }
                                    }
                                    didPreformTerminalOperation = true;
                                } catch (e) {
                                    logger.error(e);
                                    continue;
                                }
                            }
                            break;
                        }
                        case ACTION.WARN: {
                            if (!(channel instanceof BaseGuildTextChannel)) {
                                continue;
                            }
                            const warnMessage = await filter.warnMessage(guildId);
                            const warnResponse = await channel.send(`<@${member.id}>, ${warnMessage}`);
                            setTimeout(async () => {
                                try {
                                    await warnResponse.delete();
                                } catch {
                                }
                            }, 5000);
                            break;
                        }
                        case ACTION.DELETE: {
                            try {
                                if (!EventDeletedListener.isMessageDeleted(message)) {
                                    await message.delete();
                                }
                            } catch {
                                continue outer;
                            }
                        }
                    }
                    if (didPreformTerminalOperation) {
                        break outer;
                    }
                }
                const enabled = await filter.isActive(guildId);
                logger.info(`message from server ${member.guild.name} (${guildId}) violated filter ${filter.id}. Filter status is ${enabled}`);
                await filter.postProcess(message);
            }
        await this.postToLog(violatedFilters, message);
    }

    private getFromArray(userId: string, guildId: string, filter: IAutoModFilter): TerminalViolation {
        const arr = this._muteTimeoutArray.get(guildId).get(filter).rawSet;
        return arr.find(value => value.userId === userId);
    }

}

class TerminalViolation {
    public violations: number;

    public constructor(public userId: string, public filter: IAutoModFilter) {
        this.violations = 1;
    }

    public async hasViolationLimitReached(guildId: string): Promise<boolean> {
        const autoViolationCount = await this.filter.autoTerminalViolationCount(guildId);
        return this.violations >= autoViolationCount;
    }
}
