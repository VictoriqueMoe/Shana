import {AbstractRoleApplier} from "../RoleApplier/AbstractRoleApplier";
import {ArgsOf, Client, On} from "@typeit/discord";
import {Roles} from "../../../enums/Roles";
import {UserChange} from "../../../modules/automod/UserChange";
import {RolePersistenceModel} from "../../../model/DB/autoMod/impl/RolePersistence.model";
import {DiscordUtils} from "../../../utils/Utils";
import {Mute} from "../../../commands/autoMod/userBlock/Mute";
import RolesEnum = Roles.RolesEnum;

export abstract class MuteRoleListener extends AbstractRoleApplier<RolesEnum.MUTED> {

    @On("guildMemberUpdate")
    public async roleListener([oldUser, newUser]: ArgsOf<"guildMemberUpdate">, client: Client): Promise<void> {
        let didRemove = await super.onChange(RolesEnum.MUTED, new UserChange(oldUser, newUser), RolePersistenceModel);
        // mute was removed, so clear the timeout and mute Model if one exists
        if (didRemove) {
            try {
                await Mute.doRemove(newUser.id, true);
                DiscordUtils.postToLog(`User: "<@${newUser.id}> has been un-muted"`);
            } catch {
            }
        }
    }
}