import {container, registry, singleton} from "tsyringe";
import {Beans} from "../../DI/Beans";
import {EnvPropertyResolutionEngine} from "../engine/impl/EnvPropertyResolutionEngine";
import {IPropertyResolutionEngine} from "../engine/IPropertyResolutionEngine";

@registry([
    {token: Beans.IPropertyResolutionEngine, useToken: EnvPropertyResolutionEngine},
])
@singleton()
export class PropertyResolutionFactory {

    public get engines(): IPropertyResolutionEngine[] {
        return container.resolveAll(Beans.IPropertyResolutionEngine);
    }

}
