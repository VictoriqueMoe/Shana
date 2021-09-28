import {container} from "tsyringe";
import {CommandSecurityManager} from "../model/guild/manager/CommandSecurityManager";
import {Beans} from "./Beans";
import {ISubModule} from "../model/closeableModules/subModules/ISubModule";
import {AbstractFilter} from "../model/closeableModules/subModules/dynoAutoMod/AbstractFilter";
import {DynoAutoMod} from "../managedEvents/messageEvents/closeableModules/DynoAutoMod";

export function registerAfterDiscordTs(): void {
    container.afterResolution(
        CommandSecurityManager,
        (_t, result, resolutionType) => {
            if (Array.isArray(result)) {
                for (const manager of result) {
                    manager.init();
                }
            } else {
                result.init();
            }
        },
        {
            frequency: "Once"
        }
    );
    injectParentModules();
}

function injectParentModules(): void {
    const iSubModules = container.resolveAll<ISubModule>(Beans.SubModuleProxyDescriptor.token);
    const dynoAutoMod = container.resolve(DynoAutoMod);
    for (const subModule of iSubModules) {
        if (subModule instanceof AbstractFilter) {
            console.log(`Injecting parent module "${dynoAutoMod.moduleId}" into ${subModule.id}`);
            subModule.parentModule = dynoAutoMod;
        }
    }
}