import {AbstractFilter} from "../closeableModules/subModules/dynoAutoMod/AbstractFilter";
import constructor from "tsyringe/dist/typings/types/constructor";
import {container, injectable} from "tsyringe";
import {Beans} from "../../DI/Beans";

export function AutoModFilter(constructor: constructor<AbstractFilter>): void {
    injectable()(constructor);
    container.registerSingleton(Beans.ISubModuleToken, constructor);
}
