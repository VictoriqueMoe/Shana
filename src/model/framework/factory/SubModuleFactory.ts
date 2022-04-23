import {AbstractFactory} from "./AbstractFactory";
import type {ISubModule} from "../../closeableModules/subModules/ISubModule";
import {container, registry, singleton} from "tsyringe";
import {Beans} from "../../../DI/Beans";
import {ZalgoTextFilter} from "../../closeableModules/subModules/dynoAutoMod/impl/ZalgoTextFilter";
import {ImageSpamFilter} from "../../closeableModules/subModules/dynoAutoMod/impl/ImageSpamFilter";
import {LinkCooldownFilter} from "../../closeableModules/subModules/dynoAutoMod/impl/LinkCooldownFilter";
import {SpoilersFilter} from "../../closeableModules/subModules/dynoAutoMod/impl/SpoilersFilter";
import {FastMessageSpamFilter} from "../../closeableModules/subModules/dynoAutoMod/impl/FastMessageSpamFilter";
import {EmojiSpamFilter} from "../../closeableModules/subModules/dynoAutoMod/impl/EmojiSpamFilter";
import {MassMentionsFilter} from "../../closeableModules/subModules/dynoAutoMod/impl/MassMentionsFilter";
import {DiscordInviteFilter} from "../../closeableModules/subModules/dynoAutoMod/impl/DiscordInviteFilter";
import {BannedWordFilter} from "../../closeableModules/subModules/dynoAutoMod/impl/BannedWordFilter";
import {AllCapsFilter} from "../../closeableModules/subModules/dynoAutoMod/impl/AllCapsFilter";
import {EveryoneMentionsFilter} from "../../closeableModules/subModules/dynoAutoMod/impl/EveryoneMentionsFilter";
import {SpamFilter} from "../../closeableModules/subModules/dynoAutoMod/impl/SpamFilter";
import Immutable from "immutable";


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

    protected populateEngines(): Immutable.Set<ISubModule> {
        return Immutable.Set(container.resolveAll(Beans.ISubModuleToken));
    }

}
