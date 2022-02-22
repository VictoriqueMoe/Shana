import {container, registry, singleton} from "tsyringe";
import {Beans} from "../../DI/Beans";
import {EnvPropertyResolutionFactory} from "../engine/impl/EnvPropertyResolutionFactory";
import {IPropertyResolutionEngine} from "../engine/IPropertyResolutionEngine";

@registry([
    {token: Beans.IPropertyResolutionEngine, useToken: EnvPropertyResolutionFactory},
])
@singleton()
export class PropertyResolutionFactory {
    
    public get engines(): IPropertyResolutionEngine[] {
        return container.resolveAll(Beans.IPropertyResolutionEngine);
    }

}
