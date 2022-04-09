import {IPropertyResolutionEngine, Property} from "../IPropertyResolutionEngine";
import {singleton} from "tsyringe";

@singleton()
export class EnvPropertyResolutionEngine implements IPropertyResolutionEngine {

    public getProperty(prop: string): Property {
        return process.env[prop] ?? null;
    }

}
