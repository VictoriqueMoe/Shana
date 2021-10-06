import * as Immutable from 'immutable';
import {ICloseableModule} from "../ICloseableModule";
import {ISubModule} from "../subModules/ISubModule";
import {ModuleSettings} from "../ModuleSettings";
import {injectAll, singleton} from "tsyringe";
import {Beans} from "../../../DI/Beans";

@singleton()
export class SubModuleManager {

    private readonly _subModules: Set<ISubModule>;

    public constructor(@injectAll(Beans.SubModuleProxyDescriptor.token) modules: ISubModule[]) {
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