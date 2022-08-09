import {container, singleton} from "tsyringe";
import {TimedSet} from "@discordx/utilities";
import {ObjectUtil} from "../../../utils/Utils.js";
import {BaseGuildTextChannel, GuildMember} from "discord.js";
import {MessageListenerDecorator} from "../../../model/framework/decorators/messageListenerDecorator.js";
import {notBot} from "../../../guards/managedGuards/NotABot.js";
import {CloseOptionModel} from "../../../model/DB/entities/autoMod/impl/CloseOption.model.js";
import {ArgsOf, Client} from "discordx";
import ACTION from "../../../enums/ACTION.js";
import TIME_OUT from "../../../enums/TIME_OUT.js";
import {Enabled} from "../../../guards/managedGuards/Enabled.js";
import Immutable from "immutable";
import {TriggerConstraint} from "../../../model/closeableModules/impl/TriggerConstraint.js";
import {AbstractFilter} from "../../../model/closeableModules/subModules/autoMod/AbstractFilter.js";
import type {IAutoModFilter} from "../../../model/closeableModules/subModules/autoMod/IAutoModFilter.js";
import type {
    FastMessageSpamFilter
} from "../../../model/closeableModules/subModules/autoMod/impl/FastMessageSpamFilter.js";
import {EventDeletedListener} from "../eventDispatcher/EventDeletedListener.js";
import {MuteManager} from "../../../model/framework/manager/MuteManager.js";
import {LogChannelManager} from "../../../model/framework/manager/LogChannelManager.js";
import TIME_UNIT from "../../../enums/TIME_UNIT.js";

@singleton()
export class AutoMod extends TriggerConstraint<null> {

    private _muteTimeoutArray: TimedSet<TerminalViolation> = new TimedSet(AbstractFilter.terminalViolationTimeout * 1000);
    private readonly _client: Client;
    private readonly _muteManager: MuteManager;
    private readonly _logManager: LogChannelManager;

    public constructor() {
        super(CloseOptionModel);
        this._client = container.resolve(Client);
        this._muteManager = container.resolve(MuteManager);
        this._logManager = container.resolve(LogChannelManager);
    }

    public get moduleId(): string {
        return "AutoMod";
    }

    public override get submodules(): Immutable.Set<IAutoModFilter> {
        return super.submodules as Immutable.Set<IAutoModFilter>;
    }

    @MessageListenerDecorator(true, [notBot, Enabled(AutoMod)])
    private async process([message]: ArgsOf<"messageCreate">): Promise<void> {
        // if (!this.canTrigger(message.guild.id)) {
        //     return;
        // }
        const filters = this.submodules;
        const violatedFilters: IAutoModFilter[] = [];
        if (!message.member) {
            return;
        }
        const member = message.member;
        const userId = member.id;
        for (const filter of filters) {
            if (!filter.isActive) {
                continue;
            }
            // check if can trigger here based on filter options
            const didPassFilter = await filter.doFilter(message);
            if (!didPassFilter) {
                violatedFilters.push(filter);
            }
        }
        violatedFilters.sort((a, b) => a.priority - b.priority);
        const guildid = member.guild.id;
        const {channel} = message;
        outer:
            for (const filter of violatedFilters) {
                const actionsToTake = filter.actions;
                let didPreformTerminaloperation = false;
                for (const action of actionsToTake) {
                    switch (action) {
                        case ACTION.BAN:
                        case ACTION.KICK:
                        case ACTION.MUTE: {
                            if (action === ACTION.MUTE && this._muteManager.isMuted(member)) {
                                continue;
                            }
                            let fromArray = this.getFromArray(userId, guildid);
                            if (fromArray) {
                                fromArray.violations++;
                                this._muteTimeoutArray.refresh(fromArray);
                            } else {
                                fromArray = new TerminalViolation(userId, filter, guildid);
                                this._muteTimeoutArray.add(fromArray);
                            }
                            if (fromArray.hasViolationLimitReached) {
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
                                            await this.muteUser(fromArray, member, "Auto mod violation limit reached", this._client.user.id, textChannel, filter.autoMuteTimeout);
                                            break;
                                        }
                                    }
                                    didPreformTerminaloperation = true;
                                } catch (e) {
                                    console.error(e);
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
                console.log(`message from server ${member.guild.name} (${guildid}) violated filter ${filter.id}. Filter status is ${enabled}`);
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
        const model = await this._muteManager.muteUser(user, reason, time * 1000);
        this._muteTimeoutArray.delete(violationObj);
        if (model) {
            const humanMuted = ObjectUtil.timeToHuman(time, TIME_UNIT.seconds);
            await this._logManager.postToLog(`User: "${user.user.username}" has been muted for the reason: "${reason}" by module: \`"${violationObj.filter.id}"\` for ${humanMuted}`, user.guild.id);
            if (channel) {
                await channel.send(`<@${user.id}>, you have been muted for ${humanMuted} due to the violation of the \`${violationObj.filter.id}\``);
            }
        }
        return model;
    }

    private getFromArray(userId: string, guildid: string): TerminalViolation {
        const arr = this._muteTimeoutArray.rawSet;
        return arr.find(value => value.userId === userId && value._guildId === guildid);
    }

}

class TerminalViolation {
    public violations: number;

    public constructor(public userId: string, public filter: IAutoModFilter, public _guildId: string) {
        this.violations = 1;
    }

    public get hasViolationLimitReached(): boolean {
        return this.violations >= this.filter.autoTerminalViolationCount;
    }
}
