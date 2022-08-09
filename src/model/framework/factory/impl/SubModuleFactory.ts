import {injectAll, registry, singleton} from "tsyringe";
import {AbstractFactory} from "../AbstractFactory.js";
import {Beans} from "../../DI/Beans.js";
import {ISubModule} from "../../../closeableModules/subModules/ISubModule.js";
import {MassMentionsFilter} from "../../../closeableModules/subModules/autoMod/impl/MassMentionsFilter.js";
import {SpoilersFilter} from "../../../closeableModules/subModules/autoMod/impl/SpoilersFilter.js";
import {EmojiSpamFilter} from "../../../closeableModules/subModules/autoMod/impl/EmojiSpamFilter.js";
import {LinkCooldownFilter} from "../../../closeableModules/subModules/autoMod/impl/LinkCooldownFilter.js";
import {DiscordInviteFilter} from "../../../closeableModules/subModules/autoMod/impl/DiscordInviteFilter.js";
import {SpamFilter} from "../../../closeableModules/subModules/autoMod/impl/SpamFilter.js";
import {BannedWordFilter} from "../../../closeableModules/subModules/autoMod/impl/BannedWordFilter.js";
import {ImageSpamFilter} from "../../../closeableModules/subModules/autoMod/impl/ImageSpamFilter.js";
import {AllCapsFilter} from "../../../closeableModules/subModules/autoMod/impl/AllCapsFilter.js";
import {FastMessageSpamFilter} from "../../../closeableModules/subModules/autoMod/impl/FastMessageSpamFilter.js";
import {ZalgoTextFilter} from "../../../closeableModules/subModules/autoMod/impl/ZalgoTextFilter.js";
import {EveryoneMentionsFilter} from "../../../closeableModules/subModules/autoMod/impl/EveryoneMentionsFilter.js";


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
