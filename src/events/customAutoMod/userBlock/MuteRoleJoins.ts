import {AbstractRoleApplier} from "../RoleApplier/AbstractRoleApplier";
import {ArgsOf, Client, On} from "@typeit/discord";
import {RolePersistenceModel} from "../../../model/DB/autoMod/impl/RolePersistence.model";
import {DiscordUtils, GuildUtils} from "../../../utils/Utils";

//todo will ultimatly be removed once this bot replaces dyno
export abstract class MuteRoleJoins extends AbstractRoleApplier {

    @On("guildMemberAdd")
    private async muteJoins([member]: ArgsOf<"guildMemberAdd">, client: Client): Promise<void> {
        if (DiscordUtils.getModule("AutoRole").isEnabled) {
            return;
        }
        const mutedRole = await GuildUtils.RoleUtils.getMuteRole(member.guild.id);
        if (!mutedRole) {
            return;
        }
        if (await super.roleJoins(mutedRole, member, RolePersistenceModel)) {
            await DiscordUtils.postToLog(`Member <@${member.user.id}> has rejoined after leaving as muted and because of this, has been re-muted.`, member.guild.id);
        }
    }
}