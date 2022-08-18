import {singleton} from "tsyringe";

import type {IPropertyResolutionEngine, Property} from "../IPropertyResolutionEngine.js";

@singleton()
export class EnvPropertyResolutionEngine implements IPropertyResolutionEngine {
    public getProperty(prop: string): Property {
        return process.env[prop] ?? null;
    }
}
