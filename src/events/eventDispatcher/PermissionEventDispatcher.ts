import {ArgsOf, Client, Discord, On} from "discordx";
import {delay, injectable, injectAll, registry} from "tsyringe";
import {Beans} from "../../DI/Beans";
import {CommandSecurityManager} from "../../model/guild/manager/CommandSecurityManager";
import {IPermissionEventListener, RoleTypes, RoleUpdateTrigger} from "./Listeners/IPermissionEventListener";

@registry([
    {token: Beans.IPermissionEventListener, useToken: delay(() => CommandSecurityManager)},
])
@Discord()
@injectable()
export class PermissionEventDispatcher {

    public constructor(@injectAll(Beans.IPermissionEventListener) private _listeners: IPermissionEventListener[]) {
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