import {container, registry, singleton} from "tsyringe";
import {Beans} from "../../DI/Beans";
import {EnvPropertyResolutionEngine} from "../engine/impl/EnvPropertyResolutionEngine";
import {IPropertyResolutionEngine} from "../engine/IPropertyResolutionEngine";
import {PackageJsonResolutionEngine} from "../engine/impl/PackageJsonResolutionEngine";

@registry([
    {token: Beans.IPropertyResolutionEngine, useToken: EnvPropertyResolutionEngine},
    {token: Beans.IPropertyResolutionEngine, useToken: PackageJsonResolutionEngine}
])
@singleton()
export class PropertyResolutionFactory {

    public get engines(): IPropertyResolutionEngine[] {
        return container.resolveAll(Beans.IPropertyResolutionEngine);
    }

}
