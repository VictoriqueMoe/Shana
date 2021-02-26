import {CloseableModule} from "../../model/CloseableModule";
import {CloseOptionModel} from "../../model/DB/autoMod/impl/CloseOption.model";
import {ArgsOf, Client, Guard, On} from "@typeit/discord";
import {NotBot} from "../../guards/NotABot";
import {MessageGateKeeperManager} from "../../model/MessageGateKeeperManager";
import {ACTION} from "../../enums/ACTION";
import {Main} from "../../Main";
import {excludeGuard} from "../../guards/ExcludeGuard";
import {MuteSingleton} from "../../commands/autoMod/userBlock/MuteSingleton";
import {EnabledGuard} from "../../guards/EnabledGuard";

export class MessageGateKeeper extends CloseableModule {

    constructor() {
        super(CloseOptionModel);
    }

    @On("message")
    @Guard(NotBot, excludeGuard, EnabledGuard("MessageGateKeeper"))
    private async process([message]: ArgsOf<"message">, client: Client): Promise<void> {
        const filters = MessageGateKeeperManager.instance.filters;
        outer:
            for (const filter of filters) {
                const didPassFilter = filter.doFilter(message);
                if (!didPassFilter) {
                    const actionsToTake = filter.actions;
                    for (const action of actionsToTake) {
                        switch (action) {
                            case ACTION.DELETE:
                                await message.delete({
                                    reason: filter.id
                                });
                                break;
                            case ACTION.WARN: {
                                const warnResponse = await message.reply(filter.warnMessage);
                                setTimeout(() => {
                                    warnResponse.delete();
                                }, 5000);
                                break;
                            }
                            case ACTION.MUTE: {
                                const botId = Main.client.user.id;
                                await MuteSingleton.instance.muteUser(message.member, filter.warnMessage, botId, 600);
                                const warnResponse = await message.reply("you have been timed out for 10 mins");
                                setTimeout(() => {
                                    warnResponse.delete();
                                }, 5000);
                                break;
                            }
                            case ACTION.BAN:
                                await message.member.ban({
                                    reason: `auto ban for ${filter.id}`
                                });
                                break outer;
                        }
                    }
                    break;
                }
            }
    }

    public get isDynoReplacement(): boolean {
        return true;
    }

    public get moduleId(): string {
        return "MessageGateKeeper";
    }

}