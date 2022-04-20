import {CloseableModule} from "../../../model/closeableModules/impl/CloseableModule";
import {CloseOptionModel} from "../../../model/DB/entities/autoMod/impl/CloseOption.model";
import {ArgsOf, Client} from "discordx";
import {AbstractFilter} from "../../../model/closeableModules/subModules/dynoAutoMod/AbstractFilter";
import {ACTION} from "../../../enums/ACTION";
import {IDynoAutoModFilter} from "../../../model/closeableModules/subModules/dynoAutoMod/IDynoAutoModFilter";
import {BaseGuildTextChannel, GuildMember} from "discord.js";
import {MuteManager} from "../../../model/framework/manager/MuteManager";
import {DiscordUtils, ObjectUtil, TimeUtils} from "../../../utils/Utils";
import * as Immutable from "immutable";
import {MessageListenerDecorator} from "../../../model/decorators/messageListenerDecorator";
import {FastMessageSpamFilter} from "../../../model/closeableModules/subModules/dynoAutoMod/impl/FastMessageSpamFilter";
import {notBot} from "../../../guards/NotABot";
import {container, singleton} from "tsyringe";
import {TimedSet} from "@discordx/utilities";

@singleton()
export class DynoAutoMod extends CloseableModule<null> {

    private _muteTimeoutArray: TimedSet<TerminalViolation> = new TimedSet(AbstractFilter.terminalViolationTimeout * 1000);

    constructor(private _client: Client, private _muteManager: MuteManager) {
        super(CloseOptionModel);
    }

    public get moduleId(): string {
        return "DynoAutoMod";
    }

    public override get submodules(): Immutable.Set<IDynoAutoModFilter> {
        return super.submodules as Immutable.Set<IDynoAutoModFilter>;
    }

    @MessageListenerDecorator(true, notBot)
    private async process([message]: ArgsOf<"messageCreate">, client: Client): Promise<void> {
        if (!await this.canRun(message.guild.id, message.member, message.channel)) {
            return;
        }
        const filters = this.submodules;
        const violatedFilters: IDynoAutoModFilter[] = [];
        if (!message.member) {
            return;
        }
        const member = message.member;
        const userId = member.id;
        for (const filter of filters) {
            if (!filter.isActive) {
                continue;
            }
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
                                                days: 1
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
                                        if (!messageEntryM.deleted) {
                                            messageEntryM.delete().catch(() => {
                                            });
                                        }
                                    }
                                }
                            }
                            try {
                                if (!message.deleted) {
                                    message.delete().catch(() => {
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
            time = TimeUtils.TIME_OUT["1 hour"];
        }
        const muteSingleton = container.resolve(MuteManager);
        const model = await muteSingleton.muteUser(user, reason, time * 1000);
        this._muteTimeoutArray.delete(violationObj);
        if (model) {
            const humanMuted = ObjectUtil.timeToHuman(time, TimeUtils.TIME_UNIT.seconds);
            await DiscordUtils.postToLog(`User: "${user.user.username}" has been muted for the reason: "${reason}" by module: \`"${violationObj.filter.id}"\` for ${humanMuted}`, user.guild.id);
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

    constructor(public userId: string, public filter: IDynoAutoModFilter, public _guildId: string) {
        this.violations = 1;
    }

    public get hasViolationLimitReached(): boolean {
        return this.violations >= this.filter.autoTerminalViolationCount;
    }
}
