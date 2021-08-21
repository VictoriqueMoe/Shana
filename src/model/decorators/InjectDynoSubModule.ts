import {IDynoAutoModFilter} from "../closeableModules/subModules/dynoAutoMod/IDynoAutoModFilter";
import {DIService} from "discordx";
import {ISubModule} from "../closeableModules/subModules/ISubModule";
import {ICloseableModule} from "../closeableModules/ICloseableModule";
import {CloseableModule} from "../closeableModules/impl/CloseableModule";
import {MessageEventDispatcher} from "../../events/eventDispatcher/MessageEventDispatcher";

export function InjectDynoSubModule(parentModule: typeof CloseableModule) {
    // @ts-ignore
    return (constructor: typeof ISubModule): void => {
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
        const instance: IDynoAutoModFilter = new constructor(parentFilter);
        console.log(`Register submodule: "${instance.id}" with parent: "${parentFilter.moduleId}"`);
    };
}