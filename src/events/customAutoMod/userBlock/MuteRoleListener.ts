import {AbstractRoleApplier} from "../RoleApplier/AbstractRoleApplier";
import {ArgsOf, Client, On} from "@typeit/discord";
import {MemberRoleChange} from "../../../modules/automod/MemberRoleChange";
import {RolePersistenceModel} from "../../../model/DB/autoMod/impl/RolePersistence.model";
import {GuildUtils} from "../../../utils/Utils";
import {MuteSingleton} from "../../../commands/customAutoMod/userBlock/MuteSingleton";


export abstract class MuteRoleListener extends AbstractRoleApplier {

    @On("guildMemberUpdate")
    public async roleListener([oldUser, newUser]: ArgsOf<"guildMemberUpdate">, client: Client): Promise<void> {
        const mutedRole = await GuildUtils.RoleUtils.getMuteRole(newUser.guild.id);
        if (!mutedRole) {
            return;
        }
        const didRemove = await super.onChange(mutedRole, new MemberRoleChange(oldUser, newUser), RolePersistenceModel);
        // mute was removed, so clear the timeout and mute Model if one exists
        if (didRemove) {
            try {
                await MuteSingleton.instance.doRemove(newUser.id, newUser.guild.id, mutedRole.id, true);
            } catch {
            }
        }
    }
}