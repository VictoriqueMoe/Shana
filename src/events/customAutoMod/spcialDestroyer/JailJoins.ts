import {ArgsOf, Client, On} from "@typeit/discord";
import {AbstractRoleApplier} from "../RoleApplier/AbstractRoleApplier";
import {RolePersistenceModel} from "../../../model/DB/autoMod/impl/RolePersistence.model";
import {DiscordUtils, GuildUtils} from "../../../utils/Utils";


//todo will ultimatly be removed once this bot replaces dyno
export abstract class JailJoins extends AbstractRoleApplier {

    @On("guildMemberAdd")
    private async specialJoins([member]: ArgsOf<"guildMemberAdd">, client: Client): Promise<void> {
        if (DiscordUtils.getModule("AutoRole").isEnabled) {
            return;
        }
        const guildId = member.guild.id;
        const jailRole = await GuildUtils.RoleUtils.getJailRole(guildId);
        if (!jailRole) {
            return;
        }
        // member joins, check DB if they left as a special
        if (await super.roleJoins(jailRole, member, RolePersistenceModel)) {
            // member has been found (they rejoined)
            await DiscordUtils.postToLog(`Member <@${member.user.id}> has rejoined after leaving as special (possible special evasion) \n <@697417252320051291> <@593208170869162031>`, guildId);
        }
    }
}