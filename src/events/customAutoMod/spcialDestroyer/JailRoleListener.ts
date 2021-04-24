import {ArgsOf, Client, On} from "@typeit/discord";
import {AbstractRoleApplier} from "../RoleApplier/AbstractRoleApplier";
import {MemberRoleChange} from "../../../modules/automod/MemberRoleChange";
import {RolePersistenceModel} from "../../../model/DB/autoMod/impl/RolePersistence.model";
import {GuildUtils} from "../../../utils/Utils";

export abstract class jailRoleListener extends AbstractRoleApplier {

    @On("guildMemberUpdate")
    public async roleListener([oldUser, newUser]: ArgsOf<"guildMemberUpdate">, client: Client): Promise<void> {
        const jailRole = await GuildUtils.RoleUtils.getJailRole(newUser.guild.id);
        if (jailRole) {
            await super.onChange(jailRole, new MemberRoleChange(oldUser, newUser), RolePersistenceModel);
        }
    }
}