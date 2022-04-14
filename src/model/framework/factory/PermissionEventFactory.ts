import {IPermissionEventListener} from "../../../events/eventDispatcher/Listeners/IPermissionEventListener";
import Immutable from "immutable";
import {AbstractFactory} from "./AbstractFactory";
import {container, delay, registry, singleton} from "tsyringe";
import {Beans} from "../../../DI/Beans";
import {CommandSecurityManager} from "../manager/CommandSecurityManager";

@registry([
    {token: Beans.IPermissionEventListener, useToken: delay(() => CommandSecurityManager)},
])
@singleton()
export class PermissionEventFactory extends AbstractFactory<IPermissionEventListener> {

    protected populateEngines(): Immutable.Set<IPermissionEventListener> {
        return Immutable.Set(container.resolveAll(Beans.IPermissionEventListener));
    }

}
