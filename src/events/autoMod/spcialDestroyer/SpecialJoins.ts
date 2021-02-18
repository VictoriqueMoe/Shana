import {ArgsOf, Client, On} from "@typeit/discord";
import {Roles} from "../../../enums/Roles";
import {AbstractRoleApplier} from "../RoleApplier/AbstractRoleApplier";
import {RolePersistenceModel} from "../../../model/DB/autoMod/impl/RolePersistence.model";
import {DiscordUtils} from "../../../utils/Utils";
import RolesEnum = Roles.RolesEnum;

export abstract class SpecialJoins extends AbstractRoleApplier<RolesEnum.SPECIAL> {

    @On("guildMemberAdd")
    private async specialJoins([member]: ArgsOf<"guildMemberAdd">, client: Client): Promise<void> {
        // member joins, check DB if they left as a special
        if (await super.roleJoins(RolesEnum.SPECIAL, member, RolePersistenceModel)) {
            // member has been found (they rejoined)
            await DiscordUtils.postToLog(`Member <@${member.user.id}> has rejoined after leaving as special (possible special evasion) \n <@697417252320051291> <@593208170869162031>`)
        }
    }
}