import {AbstractRoleApplier} from "../RoleApplier/AbstractRoleApplier";
import {ArgsOf, Client, On} from "@typeit/discord";
import {Roles} from "../../../enums/Roles";
import {MemberRoleChange} from "../../../modules/automod/MemberRoleChange";
import {RolePersistenceModel} from "../../../model/DB/autoMod/impl/RolePersistence.model";
import {DiscordUtils} from "../../../utils/Utils";
import {MuteSingleton} from "../../../commands/customAutoMod/userBlock/MuteSingleton";
import RolesEnum = Roles.RolesEnum;

export abstract class MuteRoleListener extends AbstractRoleApplier<RolesEnum.MUTED> {

    @On("guildMemberUpdate")
    public async roleListener([oldUser, newUser]: ArgsOf<"guildMemberUpdate">, client: Client): Promise<void> {
        const didRemove = await super.onChange(RolesEnum.MUTED, new MemberRoleChange(oldUser, newUser), RolePersistenceModel);
        // mute was removed, so clear the timeout and mute Model if one exists
        if (didRemove) {
            try {
                await MuteSingleton.instance.doRemove(newUser.id, newUser.guild.id, true);
                DiscordUtils.postToLog(`User: "<@${newUser.id}> has been un-muted"`, newUser.guild.id);
            } catch {
            }
        }
    }
}