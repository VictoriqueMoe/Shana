import * as Immutable from 'immutable';
import {ICloseableModule} from "../ICloseableModule";
import {ISubModule} from "../subModules/ISubModule";
import {ModuleSettings} from "../ModuleSettings";
import {delay, inject, injectAll, registry, singleton} from "tsyringe";
import {Beans} from "../../../DI/Beans";
import {ZalgoTextFilter} from "../subModules/dynoAutoMod/impl/ZalgoTextFilter";
import {ImageSpamFilter} from "../subModules/dynoAutoMod/impl/ImageSpamFilter";
import {LinkCooldownFilter} from "../subModules/dynoAutoMod/impl/LinkCooldownFilter";
import {SpoilersFilter} from "../subModules/dynoAutoMod/impl/SpoilersFilter";
import {FastMessageSpamFilter} from "../subModules/dynoAutoMod/impl/FastMessageSpamFilter";
import {EmojiSpamFilter} from "../subModules/dynoAutoMod/impl/EmojiSpamFilter";
import {MassMentionsFilter} from "../subModules/dynoAutoMod/impl/MassMentionsFilter";
import {DiscordInviteFilter} from "../subModules/dynoAutoMod/impl/DiscordInviteFilter";
import {BannedWordFilter} from "../subModules/dynoAutoMod/impl/BannedWordFilter";
import {AllCapsFilter} from "../subModules/dynoAutoMod/impl/AllCapsFilter";
import {EveryoneMentionsFilter} from "../subModules/dynoAutoMod/impl/EveryoneMentionsFilter";
import {SpamFilter} from "../subModules/dynoAutoMod/impl/SpamFilter";
import constructor from "tsyringe/dist/typings/types/constructor";
import {PostConstruct} from "../../decorators/PostConstruct";
import {DynoAutoMod} from "../../../managedEvents/messageEvents/closeableModules/DynoAutoMod";
import {AbstractFilter} from "../subModules/dynoAutoMod/AbstractFilter";
import {CloseableModuleManager} from "../../framework/manager/CloseableModuleManager";

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
export class SubModuleManager {

    private readonly _subModules: Set<ISubModule>;

    public constructor(
        @injectAll(Beans.ISubModuleToken) modules: ISubModule[],
        @inject(delay(() => CloseableModuleManager)) private _closeableModuleManager: CloseableModuleManager) {
        this._subModules = new Set(modules);
    }

    public get subModules(): Immutable.Set<ISubModule> {
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

    public getSubModule<T extends ISubModule>(subModule: constructor<T>): T {
        return this.subModules.find(value => value.constructor === subModule) as T;
    }

    @PostConstruct
    private init(): void {
        const dynoAutoMod = this._closeableModuleManager.getModule("DynoAutoMod");
        for (const subModule of this._subModules) {
            if (subModule instanceof AbstractFilter) {
                console.log(`Registering submodule ${subModule.id} with parent module ${dynoAutoMod.constructor.name}`);
                subModule.parentModule = dynoAutoMod;
            }
        }
    }
}
