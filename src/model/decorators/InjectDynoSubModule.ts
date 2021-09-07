import {IDynoAutoModFilter} from "../closeableModules/subModules/dynoAutoMod/IDynoAutoModFilter";
import {DIService} from "@typeit/discord";
import {ICloseableModule} from "../closeableModules/ICloseableModule";
import {CloseableModule} from "../closeableModules/impl/CloseableModule";
import {MessageEventDispatcher} from "../../events/eventDispatcher/MessageEventDispatcher";
import {AbstractFilter} from "../closeableModules/subModules/dynoAutoMod/AbstractFilter";

export function InjectDynoSubModule(parentModule: typeof CloseableModule) {
    return (constructor: typeof AbstractFilter) => {
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
        console.log(`Register submodule: "${instance.id}" with parent: "${parentFilter.moduleId}"`);
    };
}