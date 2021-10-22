import * as Immutable from 'immutable';
import {ICloseableModule} from "../ICloseableModule";
import {ISubModule} from "../subModules/ISubModule";
import {ModuleSettings} from "../ModuleSettings";
import {injectAll, registry, singleton} from "tsyringe";
import {ZalgoTextFilter} from "../subModules/dynoAutoMod/impl/ZalgoTextFilter";
import {ScamFilter} from "../subModules/dynoAutoMod/impl/ScamFilter";
import {ImageSpamFilter} from "../subModules/dynoAutoMod/impl/ImageSpamFilter";
import {LinkCooldownFilter} from "../subModules/dynoAutoMod/impl/LinkCooldownFilter";
import {SpoilersFilter} from "../subModules/dynoAutoMod/impl/SpoilersFilter";
import {FastMessageSpamFilter} from "../subModules/dynoAutoMod/impl/FastMessageSpamFilter";
import {EmojiSpamFilter} from "../subModules/dynoAutoMod/impl/EmojiSpamFilter";
import {MassMentionsFilter} from "../subModules/dynoAutoMod/impl/MassMentionsFilter";
import {DiscordInviteFilter} from "../subModules/dynoAutoMod/impl/DiscordInviteFilter";
import {BannedWordFilter} from "../subModules/dynoAutoMod/impl/BannedWordFilter";
import {AllCapsFilter} from "../subModules/dynoAutoMod/impl/AllCapsFilter";
import {Beans} from "../../../DI/Beans";
import ISubModuleToken = Beans.ISubModuleToken;

@registry([
    {token: ISubModuleToken, useToken: ZalgoTextFilter},
    {token: ISubModuleToken, useToken: ScamFilter},
    {token: ISubModuleToken, useToken: ImageSpamFilter},
    {token: ISubModuleToken, useToken: LinkCooldownFilter},
    {token: ISubModuleToken, useToken: SpoilersFilter},
    {token: ISubModuleToken, useToken: FastMessageSpamFilter},
    {token: ISubModuleToken, useToken: EmojiSpamFilter},
    {token: ISubModuleToken, useToken: MassMentionsFilter},
    {token: ISubModuleToken, useToken: DiscordInviteFilter},
    {token: ISubModuleToken, useToken: BannedWordFilter},
    {token: ISubModuleToken, useToken: AllCapsFilter}
])
@singleton()
export class SubModuleManager {
    private readonly _subModules: Set<ISubModule>;

    public constructor(@injectAll(ISubModuleToken) modules: ISubModule[]) {
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