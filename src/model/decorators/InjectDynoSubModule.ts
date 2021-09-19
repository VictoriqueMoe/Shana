import {IDynoAutoModFilter} from "../closeableModules/subModules/dynoAutoMod/IDynoAutoModFilter";
import {ICloseableModule} from "../closeableModules/ICloseableModule";
import {CloseableModule} from "../closeableModules/impl/CloseableModule";
import {MessageEventDispatcher} from "../../events/eventDispatcher/MessageEventDispatcher";
import {AbstractFilter} from "../closeableModules/subModules/dynoAutoMod/AbstractFilter";
import {DIService} from "discordx";
import {SubModuleManager} from "../closeableModules/manager/SubModuleManager";

export function InjectDynoSubModule(parentModule: typeof CloseableModule) {
    return (constructor: typeof AbstractFilter): void => {
        let parentFilter: ICloseableModule<any> = DIService.instance.getService(parentModule);
        if (parentFilter == null) {
            const map = MessageEventDispatcher.messageListenerMap;
            for (const [_context,] of map) {
                if (_context.constructor === parentModule) {
                    parentFilter = _context;
                    break;
                }
            }
        }

        if (parentFilter == null) {
            throw new Error(`Unable to find any module for ${parentModule}`);
        }
        // @ts-ignore
        const instance: IDynoAutoModFilter = new constructor(parentFilter);
        SubModuleManager.instance.addSubModule(instance);
        console.log(`Register submodule: "${instance.id}" with parent: "${parentFilter.moduleId}"`);
    };
}