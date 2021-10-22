import {container} from "tsyringe";
import {Beans} from "./Beans";
import {ISubModule} from "../model/closeableModules/subModules/ISubModule";
import {DynoAutoMod} from "../managedEvents/messageEvents/closeableModules/DynoAutoMod";
import {AbstractFilter} from "../model/closeableModules/subModules/dynoAutoMod/AbstractFilter";

export async function moduleRegistrar(): Promise<void> {
    container.afterResolution(
        Beans.ISubModuleToken,
        (_t, result: ISubModule[], resolutionType) => {
            const dynoAutoMod = container.resolve(DynoAutoMod);
            for (const subModule of result) {
                if (subModule instanceof AbstractFilter) {
                    console.log(`Registering submodule ${subModule.id} with parent module ${dynoAutoMod.constructor.name}`);
                    subModule.parentModule = dynoAutoMod;
                }
            }
        },
        {
            frequency: "Once"
        }
    );
}

export function registerInstance(...instances: any): void {
    for (const instance of instances) {
        container.registerInstance(instance.constructor, instance);
    }
}