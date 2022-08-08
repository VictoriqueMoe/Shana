import {injectAll, registry, singleton} from "tsyringe";
import {AbstractFactory} from "../AbstractFactory.js";
import {Beans} from "../../DI/Beans.js";
import {ISubModule} from "../../../closeableModules/subModules/ISubModule.js";


@registry([
    {token: Beans.ISubModuleToken, useToken: ZalgoTextFilter},
    {token: Beans.ISubModuleToken, useToken: ImageSpamFilter},
    {token: Beans.ISubModuleToken, useToken: LinkCooldownFilter},
    {token: Beans.ISubModuleToken, useToken: SpoilersFilter},
    {token: Beans.ISubModuleToken, useToken: FastMessageSpamFilter},
    {token: Beans.ISubModuleToken, useToken: EmojiSpamFilter},
    {token: Beans.ISubModuleToken, useToken: MassMentionsFilter},
    {token: Beans.ISubModuleToken, useToken: DiscordInviteFilter},
    {token: Beans.ISubModuleToken, useToken: BannedWordFilter},
    {token: Beans.ISubModuleToken, useToken: AllCapsFilter},
    {token: Beans.ISubModuleToken, useToken: EveryoneMentionsFilter},
    {token: Beans.ISubModuleToken, useToken: SpamFilter}
])
@singleton()
export class SubModuleFactory extends AbstractFactory<ISubModule> {
    public constructor(@injectAll(Beans.ISubModuleToken) beans: ISubModule[]) {
        super(beans);
    }
}
