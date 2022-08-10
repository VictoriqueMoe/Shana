import {injectAll, registry, singleton} from "tsyringe";

import {Beans} from "../../DI/Beans.js";
import {EnvPropertyResolutionEngine} from "../../engine/impl/EnvPropertyResolutionEngine.js";
import type {IPropertyResolutionEngine} from "../../engine/IPropertyResolutionEngine.js";
import {AbstractFactory} from "../AbstractFactory.js";

@singleton()
@registry([
    {
        token: Beans.IPropertyResolutionEngine,
        useToken: EnvPropertyResolutionEngine
    }
])
export class PropertyResolutionFactory extends AbstractFactory<IPropertyResolutionEngine> {
    public constructor(@injectAll(Beans.IPropertyResolutionEngine) beans: IPropertyResolutionEngine[]) {
        super(beans);
    }
}
