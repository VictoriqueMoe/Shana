import * as Immutable from 'immutable';
import {ICloseableModule} from "../ICloseableModule";
import {ISubModule} from "../subModules/ISubModule";
import {ModuleSettings} from "../ModuleSettings";
import {delay, inject, singleton} from "tsyringe";
import constructor from "tsyringe/dist/typings/types/constructor";
import {CloseableModuleManager} from "../../framework/manager/CloseableModuleManager";
import {SubModuleFactory} from "../../framework/factory/SubModuleFactory";

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
}
