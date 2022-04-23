import {singleton} from "tsyringe";
import type {ICloseableModule} from "../../closeableModules/ICloseableModule";
import type Immutable from "immutable";
import type {constructor} from "tsyringe/dist/typings/types";
import type {CloseableModuleFactory} from "../factory/CloseableModuleFactory";

@singleton()
export class CloseableModuleManager {

    private readonly _closeableModules: Immutable.Set<ICloseableModule<unknown>>;

    public constructor(closeableModuleFactory: CloseableModuleFactory) {
        this._closeableModules = closeableModuleFactory.engines;
    }

    public get closeableModules(): Immutable.Set<ICloseableModule<unknown>> {
        return this._closeableModules;
    }

    public getCloseableModule<F, T extends ICloseableModule<F>>(closeableModule: constructor<T>): T {
        return this.closeableModules.find(value => value.constructor === closeableModule) as T;
    }

    public getModule(moduleId: string): ICloseableModule<any> {
        return this.closeableModules.find(closeableModule => closeableModule.moduleId === moduleId) ?? null;
    }

}
