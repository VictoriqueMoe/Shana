import {delay, inject, singleton} from "tsyringe";
import {TimedSet} from "@discordx/utilities";
import {ObjectUtil} from "../../../utils/Utils.js";
import {BaseGuildTextChannel, GuildMember} from "discord.js";
import {MessageListenerDecorator} from "../../../model/framework/decorators/messageListenerDecorator.js";
import {notBot} from "../../../guards/managedGuards/NotABot.js";
import {ArgsOf, Client} from "discordx";
import ACTION from "../../../enums/ACTION.js";
import TIME_OUT from "../../../enums/TIME_OUT.js";
import {Enabled} from "../../../guards/managedGuards/Enabled.js";
import Immutable from "immutable";
import {TriggerConstraint} from "../../../model/closeableModules/impl/TriggerConstraint.js";
import type {IAutoModFilter} from "../../../model/closeableModules/subModules/autoMod/IAutoModFilter.js";
import type {
    FastMessageSpamFilter
} from "../../../model/closeableModules/subModules/autoMod/impl/FastMessageSpamFilter.js";
import {EventDeletedListener} from "../../djxManaged/eventDispatcher/EventDeletedListener.js";
import {MuteManager} from "../../../model/framework/manager/MuteManager.js";
import {LogChannelManager} from "../../../model/framework/manager/LogChannelManager.js";
import TIME_UNIT from "../../../enums/TIME_UNIT.js";
import {FilterModuleManager} from "../../../model/framework/manager/FilterModuleManager.js";
import logger from "../../../utils/LoggerFactory.js";
import {PostConstruct} from "../../../model/framework/decorators/PostConstruct.js";

@singleton()
export class AutoMod extends TriggerConstraint<null> {

    private readonly _muteTimeoutArray: Map<string, Map<IAutoModFilter, TimedSet<TerminalViolation>>> = new Map();

    public constructor(private _client?: Client,
                       private _muteManager?: MuteManager,
                       private _logManager?: LogChannelManager,
                       @inject(delay(() => FilterModuleManager)) private _filterModuleManager?: FilterModuleManager) {
        super();
    }

    public get moduleId(): string {
        return "AutoMod";
    }

    public override get submodules(): Immutable.Set<IAutoModFilter> {
        return super.submodules as Immutable.Set<IAutoModFilter>;
    }


    @PostConstruct
    public async init(): Promise<void> {
        for (const [guildId] of this._client.guilds.cache) {
            for (const filter of this.submodules) {
                const timeout = await filter.terminalViolationTimeout(guildId);
                const timedSet = new TimedSet<TerminalViolation>(timeout * 1000);
                if (this._muteTimeoutArray.has(guildId)) {
                    if (this._muteTimeoutArray.get(guildId).has(filter)) {
                        continue;
                    }
                    this._muteTimeoutArray.get(guildId).set(filter, timedSet);
                } else {
                    const newMap: Map<IAutoModFilter, TimedSet<TerminalViolation>> = new Map();
                    newMap.set(filter, timedSet);
                    this._muteTimeoutArray.set(guildId, newMap);
                }
            }
        }
    }

    @MessageListenerDecorator(true, [notBot, Enabled(AutoMod)])
    private async process([message]: ArgsOf<"messageCreate">): Promise<void> {
        const filters = this.submodules;
        let violatedFilters: IAutoModFilter[] = [];
        if (!message.member) {
            return;
        }
        const guildid = message.guildId;
        const member = message.member;
        const userId = member.id;
        for (const filter of filters) {
            if (!(await filter.isActive(guildid))) {
                continue;
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
            return filter.priority(guildid).then(priority => {
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
                const actionsToTake = await filter.actions(guildid);
                let didPreformTerminaloperation = false;
                for (const action of actionsToTake) {
                    switch (action) {
                        case ACTION.BAN:
                        case ACTION.KICK:
                        case ACTION.MUTE: {
                            if (action === ACTION.MUTE && this._muteManager.isMuted(member)) {
                                continue;
                            }
                            let fromArray = this.getFromArray(userId, guildid, filter);
                            if (fromArray) {
                                fromArray.violations++;
                                this._muteTimeoutArray.get(guildid).get(filter).refresh(fromArray);
                            } else {
                                fromArray = new TerminalViolation(userId, filter, guildid);
                                this._muteTimeoutArray.get(guildid).get(filter).add(fromArray);
                            }
                            if (await fromArray.hasViolationLimitReached(guildid)) {
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
                                            const autoMuteTimeout = await filter.autoMuteTimeout(guildid);
                                            await this.muteUser(fromArray, member, "Auto mod violation limit reached", this._client.user.id, textChannel, autoMuteTimeout);
                                            break;
                                        }
                                    }
                                    didPreformTerminaloperation = true;
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
                            const warnResponse = await channel.send(`<@${member.id}>, ${filter.warnMessage}`);
                            setTimeout(async () => {
                                try {
                                    await warnResponse.delete();
                                } catch {
                                }
                            }, 5000);
                            break;
                        }
                        case ACTION.DELETE: {
                            if (filter.constructor.name === "FastMessageSpamFilter") {
                                const messageSpamEntry = (filter as FastMessageSpamFilter).getFromArray(userId, guildid);
                                if (messageSpamEntry) {
                                    for (const messageEntryM of messageSpamEntry.messages) {
                                        if (!EventDeletedListener.isMessageDeleted(messageEntryM)) {
                                            messageEntryM.delete().catch(() => {
                                                return false;
                                            });
                                        }
                                    }
                                }
                            }
                            try {
                                if (!EventDeletedListener.isMessageDeleted(message)) {
                                    message.delete().catch(() => {
                                        return false;
                                    });
                                }
                            } catch {
                                continue outer;
                            }
                        }
                    }
                    if (didPreformTerminaloperation) {
                        break outer;
                    }
                }
                const enabled = await this.isEnabled(guildid);
                logger.info(`message from server ${member.guild.name} (${guildid}) violated filter ${filter.id}. Filter status is ${enabled}`);
                filter.postProcess(message);
            }
    }

    private async muteUser(violationObj: TerminalViolation, user: GuildMember, reason: string, creatorID: string, channel?: BaseGuildTextChannel, time?: number): Promise<GuildMember> {
        if (!user) {
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

    private getFromArray(userId: string, guildId: string, filter: IAutoModFilter): TerminalViolation {
        const arr = this._muteTimeoutArray.get(guildId).get(filter).rawSet;
        return arr.find(value => value.userId === userId && value._guildId === guildId);
    }

}

class TerminalViolation {
    public violations: number;

    public constructor(public userId: string, public filter: IAutoModFilter, public _guildId: string) {
        this.violations = 1;
    }

    public async hasViolationLimitReached(guildId: string): Promise<boolean> {
        const autoViolationCount = await this.filter.autoTerminalViolationCount(guildId);
        return this.violations >= autoViolationCount;
    }
}
