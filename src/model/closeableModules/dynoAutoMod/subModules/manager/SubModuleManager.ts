import * as Immutable from 'immutable';
import {ISubModule} from "../ISubModule";
import {ICloseableModule} from "../../../ICloseableModule";

export class SubModuleManager {

    private static _instance: SubModuleManager;
    private readonly _subModules: Set<ISubModule>;

    private constructor() {
        this._subModules = new Set();
    }

    public static get instance(): SubModuleManager {
        if (!SubModuleManager._instance) {
            SubModuleManager._instance = new SubModuleManager();
        }
        return SubModuleManager._instance;
    }

    public addSubModules(filter: ISubModule): void {
        this._subModules.add(filter);
    }

    public get allSubModules(): Immutable.Set<ISubModule> {
        return Immutable.Set.of(...this._subModules.values());
    }

    public getSubModulesFromParent(parent: ICloseableModule): Immutable.Set<ISubModule> {
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