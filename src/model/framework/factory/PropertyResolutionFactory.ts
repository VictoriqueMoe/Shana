import {container, registry, singleton} from "tsyringe";
import {Beans} from "../../../DI/Beans";
import {EnvPropertyResolutionEngine} from "../engine/impl/EnvPropertyResolutionEngine";
import {IPropertyResolutionEngine} from "../engine/IPropertyResolutionEngine";
import {PackageJsonResolutionEngine} from "../engine/impl/PackageJsonResolutionEngine";
import {PostConstruct} from "../../decorators/PostConstruct";

@registry([
    {token: Beans.IPropertyResolutionEngine, useToken: EnvPropertyResolutionEngine},
    {token: Beans.IPropertyResolutionEngine, useToken: PackageJsonResolutionEngine}
])
@singleton()
export class PropertyResolutionFactory {

    private _engines: IPropertyResolutionEngine[];

    public get engines(): IPropertyResolutionEngine[] {
        return this._engines;
    }

    @PostConstruct
    private init(): void {
        this._engines = container.resolveAll(Beans.IPropertyResolutionEngine);
    }

}
