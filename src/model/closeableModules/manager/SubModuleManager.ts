import * as Immutable from 'immutable';
import {ICloseableModule} from "../ICloseableModule";
import {ISubModule} from "../subModules/ISubModule";
import {ModuleSettings} from "../ModuleSettings";

export class SubModuleManager {

    private readonly _subModules: Set<ISubModule>;

    private constructor() {
        this._subModules = new Set();
    }

    private static _instance: SubModuleManager;

    public static get instance(): SubModuleManager {
        if (!SubModuleManager._instance) {
            SubModuleManager._instance = new SubModuleManager();
        }
        return SubModuleManager._instance;
    }

    public get allSubModules(): Immutable.Set<ISubModule> {
        return Immutable.Set.of(...this._subModules.values());
    }

    public addSubModule(filter: ISubModule): void {
        this._subModules.add(filter);
    }

    public getSubModulesFromParent(parent: ICloseableModule<ModuleSettings>): Immutable.Set<ISubModule> {
        const returnSet: Set<ISubModule> = new Set();
        for (const subModule of this._subModules) {
            const subModuleParent = subModule.parentModule;
            if (subModuleParent.uid === parent.uid) {
                returnSet.add(subModule);
            }
        }
        return Immutable.Set.of(...returnSet.values());
    }
}