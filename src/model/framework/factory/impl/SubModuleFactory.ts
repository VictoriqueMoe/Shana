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
import {getInstanceCashingSingletonFactory} from "../../DI/moduleRegistrar.js";


@singleton()
@registry([
    {token: Beans.ISubModuleToken, useFactory: getInstanceCashingSingletonFactory(ZalgoTextFilter)},
    {token: Beans.ISubModuleToken, useFactory: getInstanceCashingSingletonFactory(ImageSpamFilter)},
    {token: Beans.ISubModuleToken, useFactory: getInstanceCashingSingletonFactory(LinkCooldownFilter)},
    {token: Beans.ISubModuleToken, useFactory: getInstanceCashingSingletonFactory(SpoilersFilter)},
    {token: Beans.ISubModuleToken, useFactory: getInstanceCashingSingletonFactory(FastMessageSpamFilter)},
    {token: Beans.ISubModuleToken, useFactory: getInstanceCashingSingletonFactory(EmojiSpamFilter)},
    {token: Beans.ISubModuleToken, useFactory: getInstanceCashingSingletonFactory(MassMentionsFilter)},
    {token: Beans.ISubModuleToken, useFactory: getInstanceCashingSingletonFactory(DiscordInviteFilter)},
    {token: Beans.ISubModuleToken, useFactory: getInstanceCashingSingletonFactory(BannedWordFilter)},
    {token: Beans.ISubModuleToken, useFactory: getInstanceCashingSingletonFactory(AllCapsFilter)},
    {token: Beans.ISubModuleToken, useFactory: getInstanceCashingSingletonFactory(EveryoneMentionsFilter)},
    {token: Beans.ISubModuleToken, useFactory: getInstanceCashingSingletonFactory(SpamFilter)}
])
export class SubModuleFactory extends AbstractFactory<ISubModule> {
    public constructor(@injectAll(Beans.ISubModuleToken) beans: ISubModule[]) {
        super(beans);
    }
}
