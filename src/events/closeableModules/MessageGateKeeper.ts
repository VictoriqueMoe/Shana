import {CloseableModule} from "../../model/closeableModules/impl/CloseableModule";
import {CloseOptionModel} from "../../model/DB/autoMod/impl/CloseOption.model";
import {ArgsOf, Client, Guard, On} from "@typeit/discord";
import {NotBot} from "../../guards/NotABot";
import {MessageGateKeeperManager} from "../../model/closeableModules/dynoAutoMod/subModules/MessageGateKeeperFilters/manager/MessageGateKeeperManager";
import {excludeGuard} from "../../guards/ExcludeGuard";
import {EnabledGuard} from "../../guards/EnabledGuard";
import {TimedSet} from "../../model/Impl/TimedSet";
import {AbstractFilter} from "../../model/closeableModules/dynoAutoMod/subModules/MessageGateKeeperFilters/AbstractFilter";
import {ACTION} from "../../enums/ACTION";
import {IMessageGateKeeperFilter} from "../../model/closeableModules/dynoAutoMod/subModules/MessageGateKeeperFilters/IMessageGateKeeperFilter";
import {GuildMember} from "discord.js";
import {MuteModel} from "../../model/DB/autoMod/impl/Mute.model";
import {MuteSingleton} from "../../commands/autoMod/userBlock/MuteSingleton";
import {Main} from "../../Main";
import {DiscordUtils, ObjectUtil} from "../../utils/Utils";
import {ISubModule} from "../../model/closeableModules/dynoAutoMod/subModules/ISubModule";

export class MessageGateKeeper extends CloseableModule {

    private _muteTimeoutArray: TimedSet<MuteViolation> = new TimedSet(AbstractFilter.muteViolationTimeout * 1000);

    constructor() {
        super(CloseOptionModel);
    }

    @On("message")
    @Guard(NotBot, excludeGuard, EnabledGuard("MessageGateKeeper"))
    private async process([message]: ArgsOf<"message">, client: Client): Promise<void> {
        const filters = MessageGateKeeperManager.instance.filters;
        const violatedFilters: IMessageGateKeeperFilter[] = [];
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
        for (const filter of violatedFilters) {
            const actionsToTake = filter.actions;
            for (const action of actionsToTake) {
                switch (action) {
                    case ACTION.MUTE: {
                        let fromArray = this.getFromArray(userId);
                        if (fromArray) {
                            fromArray.muteViolations++;
                            this._muteTimeoutArray.refresh(fromArray);
                        } else {
                            fromArray = new MuteViolation(userId, filter.id);
                            this._muteTimeoutArray.add(fromArray);
                        }
                        if (fromArray.hasViolationLimitReached) {
                            try {
                                await this.muteUser(fromArray, member, "Auto mod violation limit reached", Main.client.user.id, AbstractFilter.autoMuteTimeout);
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
                        await message.delete({
                            reason: `Auto mod violation "${filter.id}"`
                        });
                        break;
                    }
                }
            }
        }
    }

    private async muteUser(violationObj: MuteViolation, user: GuildMember, reason: string, creatorID: string, seconds?: number): Promise<MuteModel> {
        const model = await MuteSingleton.instance.muteUser(user, reason, creatorID, seconds);
        this._muteTimeoutArray.delete(violationObj);
        await DiscordUtils.postToLog(`User: "${user.user.username}" has been muted for the reason: "${reason}" by module: "${violationObj.filterId}" for ${ObjectUtil.secondsToHuman(seconds)}`);
        return model;
    }

    public get isDynoReplacement(): boolean {
        return true;
    }

    public get moduleId(): string {
        return "MessageGateKeeper";
    }

    private getFromArray(userId: string): MuteViolation {
        const arr = this._muteTimeoutArray.rawSet;
        return arr.find(value => value.userId === userId);
    }

    public get submodules(): ISubModule[] {
        return [];
    }

}

class MuteViolation {
    public muteViolations: number;

    constructor(public userId, public filterId: string) {
        this.muteViolations = 1;
    }

    public get hasViolationLimitReached(): boolean {
        return this.muteViolations >= AbstractFilter.autoMuteViolationCount;
    }
}