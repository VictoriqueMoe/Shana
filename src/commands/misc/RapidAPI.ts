import {DefaultPermissionResolver, Discord, Permission, SlashGroup} from "discordx";
import {injectable} from "tsyringe";
import {AbstractCommand} from "../AbstractCommand";
import {D7SMSManager} from "../../model/rapidApi/D7SMSManager";
import {Category} from "../../modules/category";

@Discord()
@Category("rapid_api", "Commands to interact with various endpoints")
@Category("rapid_api", [])
@SlashGroup({
    name: "rapid_api",
    description: "Commands to interact with various endpoints",
})
@SlashGroup("rapid_api")
@Permission(new DefaultPermissionResolver(AbstractCommand.getDefaultPermissionAllow))
@Permission(AbstractCommand.getPermissions)
@injectable()
export class RapidAPI extends AbstractCommand {

    public constructor(private _d7SMSManager: D7SMSManager) {
        super();
    }

}
