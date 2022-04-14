import {ArgsOf, Client, Discord, On} from "discordx";
import {injectable} from "tsyringe";
import {IPermissionEventListener, RoleTypes, RoleUpdateTrigger} from "./Listeners/IPermissionEventListener";
import {PermissionEventFactory} from "../../model/framework/factory/PermissionEventFactory";
import Immutable from "immutable";


@Discord()
@injectable()
export class PermissionEventDispatcher {

    private _listeners: Immutable.Set<IPermissionEventListener>;

    public constructor(permissionEventFactory: PermissionEventFactory) {
        this._listeners = permissionEventFactory.engines;
    }

    @On("roleUpdate")
    private async roleUpdated([oldRole, newRole]: ArgsOf<"roleUpdate">, client: Client): Promise<void> {
        return this.trigger([oldRole, newRole], "roleUpdate");
    }

    @On("roleCreate")
    private async roleCreated([role]: ArgsOf<"roleCreate">, client: Client): Promise<void> {
        return this.trigger([role], "roleCreate");
    }

    @On("roleDelete")
    private async roleDeleted([role]: ArgsOf<"roleDelete">, client: Client): Promise<void> {
        return this.trigger([role], "roleDelete");
    }

    private trigger(event: RoleUpdateTrigger, type: RoleTypes): Promise<void> {
        const pArr = this._listeners.map(listener => {
            return listener.trigger(event, type);
        });
        return Promise.all(pArr).then();
    }
}
