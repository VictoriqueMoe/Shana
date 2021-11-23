import * as Immutable from 'immutable';
import {ICloseableModule} from "../ICloseableModule.js";
import {ISubModule} from "../subModules/ISubModule.js";
import {ModuleSettings} from "../ModuleSettings.js";
import {injectAll, registry, singleton} from "tsyringe";
import {Beans} from "../../../DI/Beans.js";
import {ZalgoTextFilter} from "../subModules/dynoAutoMod/impl/ZalgoTextFilter.js";
import {ImageSpamFilter} from "../subModules/dynoAutoMod/impl/ImageSpamFilter.js";
import {LinkCooldownFilter} from "../subModules/dynoAutoMod/impl/LinkCooldownFilter.js";
import {SpoilersFilter} from "../subModules/dynoAutoMod/impl/SpoilersFilter.js";
import {FastMessageSpamFilter} from "../subModules/dynoAutoMod/impl/FastMessageSpamFilter.js";
import {EmojiSpamFilter} from "../subModules/dynoAutoMod/impl/EmojiSpamFilter.js";
import {MassMentionsFilter} from "../subModules/dynoAutoMod/impl/MassMentionsFilter.js";
import {DiscordInviteFilter} from "../subModules/dynoAutoMod/impl/DiscordInviteFilter.js";
import {BannedWordFilter} from "../subModules/dynoAutoMod/impl/BannedWordFilter.js";
import {AllCapsFilter} from "../subModules/dynoAutoMod/impl/AllCapsFilter.js";

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
    {token: Beans.ISubModuleToken, useToken: AllCapsFilter}
])
@singleton()
export class SubModuleManager {

    private readonly _subModules: Set<ISubModule>;

    public constructor(@injectAll(Beans.ISubModuleToken) modules: ISubModule[]) {
        this._subModules = new Set(modules);
    }

    public get allSubModules(): Immutable.Set<ISubModule> {
        return Immutable.Set.of(...this._subModules.values());
    }

    public getSubModulesFromParent(parent: ICloseableModule<ModuleSettings>): Immutable.Set<ISubModule> {
        const returnSet: Set<ISubModule> = new Set();
        for (const subModule of this._subModules) {
            const subModuleParent = subModule.parentModule;
            if (subModuleParent === parent) {
                returnSet.add(subModule);
            }
        }
        return Immutable.Set.of(...returnSet.values());
    }
}