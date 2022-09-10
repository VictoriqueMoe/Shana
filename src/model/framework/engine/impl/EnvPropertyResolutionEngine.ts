import type {IPropertyResolutionEngine, PropertyTYpe} from "../IPropertyResolutionEngine.js";

export class EnvPropertyResolutionEngine implements IPropertyResolutionEngine {
    public getProperty(prop: string): PropertyTYpe {
        return process.env[prop] ?? null;
    }
}
