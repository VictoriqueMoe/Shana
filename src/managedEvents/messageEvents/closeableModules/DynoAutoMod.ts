import {CloseableModule} from "../../../model/closeableModules/impl/CloseableModule";
import {CloseOptionModel} from "../../../model/DB/autoMod/impl/CloseOption.model";
import {ArgsOf, Client} from "@typeit/discord";
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
import {MessageListenerDecorator, notBot} from "../../../model/decorators/messageListenerDecorator";

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

    public get submodules(): Immutable.Set<IDynoAutoModFilter> {
        return super.submodules as Immutable.Set<IDynoAutoModFilter>;
    }

    @MessageListenerDecorator(true, notBot)
    private async process([message]: ArgsOf<"message">, client: Client): Promise<void> {
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
            const didPassFilter = filter.doFilter(message);
            if (!didPassFilter) {
                violatedFilters.push(filter);
            }
        }
        violatedFilters.sort((a, b) => a.priority - b.priority);
        const mutedRole = await GuildUtils.RoleUtils.getMuteRole(message.guild.id);
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
                            if (await MuteSingleton.instance.isMuted(member)) {
                                continue;
                            }
                            let fromArray = this.getFromArray(userId, member.guild.id);
                            if (fromArray) {
                                fromArray.muteViolations++;
                                this._muteTimeoutArray.refresh(fromArray);
                            } else {
                                fromArray = new MuteViolation(userId, filter.id, member.guild.id);
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
                            setTimeout(() => {
                                warnResponse.delete();
                            }, 5000);
                            break;
                        }
                        case ACTION.DELETE: {
                            if ('cooldownArray' in filter) {
                                // @ts-ignore
                                const entry = filter.getFromArray(message.member.id, message.guild.id);
                                const toDelete = entry.messageArray;
                                for (const messageToDelete of toDelete) {
                                    try {
                                        await messageToDelete.delete({
                                            reason: `Auto mod violation "${filter.id}"`
                                        });
                                    } catch {
                                        continue outer;
                                    }
                                }
                                entry.messageArray = [];
                            } else {
                                try {
                                    await message.delete({
                                        reason: `Auto mod violation "${filter.id}"`
                                    });
                                } catch {
                                    continue outer;
                                }
                            }
                            break;
                        }
                    }
                    if (didPreformTerminaloperation) {
                        break outer;
                    }
                }
                const enabled = await this.isEnabled(member.guild.id);
                console.log(`message from server ${member.guild.name} (${member.guild.id}) violated filter ${filter.id}. Filter status is ${enabled}`);
                filter.postProcess(message);
            }
    }

    private async muteUser(violationObj: MuteViolation, user: GuildMember, reason: string, creatorID: string, channel?: TextChannel, seconds?: number): Promise<MuteModel> {
        if (!user) {
            return;
        }
        const model = await MuteSingleton.instance.muteUser(user, reason, creatorID, seconds);
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

    constructor(public userId, public filterId: string, public _guildId: string) {
        this.muteViolations = 1;
    }

    public get hasViolationLimitReached(): boolean {
        return this.muteViolations >= AbstractFilter.autoMuteViolationCount;
    }
}