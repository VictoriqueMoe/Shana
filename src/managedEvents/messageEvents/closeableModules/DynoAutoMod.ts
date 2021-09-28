import {CloseableModule} from "../../../model/closeableModules/impl/CloseableModule";
import {CloseOptionModel} from "../../../model/DB/autoMod/impl/CloseOption.model";
import {ArgsOf, Client} from "discordx";
import {TimedSet} from "../../../model/Impl/TimedSet";
import {AbstractFilter} from "../../../model/closeableModules/subModules/dynoAutoMod/AbstractFilter";
import {ACTION} from "../../../enums/ACTION";
import {IDynoAutoModFilter} from "../../../model/closeableModules/subModules/dynoAutoMod/IDynoAutoModFilter";
import {GuildMember, TextChannel} from "discord.js";
import {MuteModel} from "../../../model/DB/autoMod/impl/Mute.model";
import {MuteSingleton} from "../../../commands/customAutoMod/userBlock/MuteSingleton";
import {Main} from "../../../Main";
import {DiscordUtils, GuildUtils, ObjectUtil} from "../../../utils/Utils";
import * as Immutable from "immutable";
import {MessageListenerDecorator} from "../../../model/decorators/messageListenerDecorator";
import {FastMessageSpamFilter} from "../../../model/closeableModules/subModules/dynoAutoMod/impl/FastMessageSpamFilter";
import {notBot} from "../../../guards/NotABot";
import {container, singleton} from "tsyringe";

@singleton()
export class DynoAutoMod extends CloseableModule<null> {

    private static _uid = ObjectUtil.guid();
    private _muteTimeoutArray: TimedSet<MuteViolation> = new TimedSet(AbstractFilter.muteViolationTimeout * 1000);

    constructor() {
        super(CloseOptionModel, DynoAutoMod._uid);
    }

    public get isDynoReplacement(): boolean {
        return true;
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
        if (Main.testMode && userId !== "697417252320051291") {
            return;
        }
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
        const mutedRole = await GuildUtils.RoleUtils.getMuteRole(message.guild.id);
        const guildid = member.guild.id;
        const muteSingleton = container.resolve(MuteSingleton);
        outer:
            for (const filter of violatedFilters) {
                const actionsToTake = filter.actions;
                let didPreformTerminaloperation = false;
                for (const action of actionsToTake) {
                    switch (action) {
                        case ACTION.MUTE: {
                            if (!mutedRole) {
                                continue;
                            }
                            if (await muteSingleton.isMuted(member)) {
                                continue;
                            }
                            let fromArray = this.getFromArray(userId, guildid);
                            if (fromArray) {
                                fromArray.muteViolations++;
                                this._muteTimeoutArray.refresh(fromArray);
                            } else {
                                fromArray = new MuteViolation(userId, filter.id, guildid);
                                this._muteTimeoutArray.add(fromArray);
                            }
                            if (fromArray.hasViolationLimitReached) {
                                try {
                                    let textChannel: TextChannel = null;
                                    const channel = message.channel;
                                    if (channel instanceof TextChannel) {
                                        textChannel = channel;
                                    }
                                    await this.muteUser(fromArray, member, "Auto mod violation limit reached", Main.client.user.id, textChannel, AbstractFilter.autoMuteTimeout);
                                    didPreformTerminaloperation = true;
                                } catch (e) {
                                    console.error(e);
                                    continue;
                                }
                            }
                            break;
                        }
                        case ACTION.WARN: {
                            const warnResponse = await message.reply(filter.warnMessage);
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

    private async muteUser(violationObj: MuteViolation, user: GuildMember, reason: string, creatorID: string, channel?: TextChannel, seconds?: number): Promise<MuteModel> {
        if (!user) {
            return;
        }
        const muteSingleton = container.resolve(MuteSingleton);
        const model = await muteSingleton.muteUser(user, reason, creatorID, seconds);
        this._muteTimeoutArray.delete(violationObj);
        if (model) {
            const humanMuted = ObjectUtil.secondsToHuman(seconds);
            await DiscordUtils.postToLog(`User: "${user.user.username}" has been muted for the reason: "${reason}" by module: "${violationObj.filterId}" for ${humanMuted}`, user.guild.id);
            if (channel) {
                await channel.send(`<@${user.id}>, you have been muted for ${humanMuted} due to the violation of the ${violationObj.filterId}`);
            }
        }
        return model;
    }

    private getFromArray(userId: string, guildid: string): MuteViolation {
        const arr = this._muteTimeoutArray.rawSet;
        return arr.find(value => value.userId === userId && value._guildId === guildid);
    }

}

class MuteViolation {
    public muteViolations: number;

    constructor(public userId: string, public filterId: string, public _guildId: string) {
        this.muteViolations = 1;
    }

    public get hasViolationLimitReached(): boolean {
        return this.muteViolations >= AbstractFilter.autoMuteViolationCount;
    }
}