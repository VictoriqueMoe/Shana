import * as Immutable from 'immutable';
import {singleton} from "tsyringe";
import {ModuleSettings} from "../../closeableModules/ModuleSettings.js";
import {ICloseableModule} from "../../closeableModules/ICloseableModule.js";
import {ISubModule} from "../../closeableModules/subModules/ISubModule.js";
import type constructor from "tsyringe/dist/typings/types/constructor";
import {SubModuleFactory} from "../factory/impl/SubModuleFactory.js";

@singleton()
export class SubModuleManager {

    private readonly _subModules: Immutable.Set<ISubModule>;

    public constructor(subModuleFactory: SubModuleFactory) {
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

}
