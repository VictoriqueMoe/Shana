import {AbstractRoleApplier} from "../RoleApplier/AbstractRoleApplier";
import {Roles} from "../../../enums/Roles";
import {ArgsOf, Client, On} from "@typeit/discord";
import {RolePersistenceModel} from "../../../model/DB/autoMod/RolePersistence.model";
import {DiscordUtils} from "../../../utils/Utils";
import RolesEnum = Roles.RolesEnum;

export abstract class MuteRoleJoins extends AbstractRoleApplier<RolesEnum.MUTED> {

    @On("guildMemberAdd")
    private async muteJoins([member]: ArgsOf<"guildMemberAdd">, client: Client): Promise<void> {
        if(await super.roleJoins(RolesEnum.MUTED, member, RolePersistenceModel)){
            await DiscordUtils.postToLog(`Member <@${member.user.id}> has rejoined after leaving as muted and because of this, has been re-muted.`);
        }
    }
}