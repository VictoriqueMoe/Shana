import * as Immutable from 'immutable';
import type {ICloseableModule} from "../ICloseableModule";
import type {ISubModule} from "../subModules/ISubModule";
import type {ModuleSettings} from "../ModuleSettings";
import {delay, inject, singleton} from "tsyringe";
import type constructor from "tsyringe/dist/typings/types/constructor";
import {PostConstruct} from "../../decorators/PostConstruct";
import {DynoAutoMod} from "../../../managedEvents/messageEvents/closeableModules/DynoAutoMod";
import {AbstractFilter} from "../subModules/dynoAutoMod/AbstractFilter";
import {CloseableModuleManager} from "../../framework/manager/CloseableModuleManager";
import type {SubModuleFactory} from "../../framework/factory/SubModuleFactory";

@singleton()
export class SubModuleManager {

    private readonly _subModules: Immutable.Set<ISubModule>;

    public constructor(
        subModuleFactory: SubModuleFactory,
        @inject(delay(() => CloseableModuleManager)) private _closeableModuleManager: CloseableModuleManager) {
        this._subModules = subModuleFactory.engines;
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
        return Immutable.Set(returnSet);
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
