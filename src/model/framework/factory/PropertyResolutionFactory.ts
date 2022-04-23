import {container, registry, singleton} from "tsyringe";
import {Beans} from "../../../DI/Beans";
import {EnvPropertyResolutionEngine} from "../engine/impl/EnvPropertyResolutionEngine";
import type {IPropertyResolutionEngine} from "../engine/IPropertyResolutionEngine";
import {PackageJsonResolutionEngine} from "../engine/impl/PackageJsonResolutionEngine";
import Immutable from 'immutable';
import {AbstractFactory} from "./AbstractFactory";

@registry([
    {token: Beans.IPropertyResolutionEngine, useToken: EnvPropertyResolutionEngine},
    {token: Beans.IPropertyResolutionEngine, useToken: PackageJsonResolutionEngine}
])
@singleton()
export class PropertyResolutionFactory extends AbstractFactory<IPropertyResolutionEngine> {

    protected populateEngines(): Immutable.Set<IPropertyResolutionEngine> {
        return Immutable.Set(container.resolveAll(Beans.IPropertyResolutionEngine));
    }


}
