import {ArgsOf, Client, Discord, On} from "discordx";
import {AbstractAdminAuditLogger} from "./AbstractAdminAuditLogger";
import {DiscordUtils, GuildUtils, ObjectUtil} from "../../../../utils/Utils";
import {MessageEmbed} from "discord.js";

/**
 * Will log: <br />
 * Server changes
 */
@Discord()
export class GuildLogger extends AbstractAdminAuditLogger {

    @On("guildUpdate")
    private async guildUpdate([oldGuild, newGuild]: ArgsOf<"guildUpdate">, client: Client): Promise<void> {
        const guildUpdate = DiscordUtils.getGuildUpdate(oldGuild, newGuild);
        if (!ObjectUtil.isValidObject(guildUpdate)) {
            return;
        }
        const guildId = newGuild.id;
        const embed = new MessageEmbed()
            .setColor('#43B581')
            .setAuthor(GuildUtils.getGuildName(guildId), GuildUtils.getGuildIconUrl(guildId))
            .setTitle(`Server Settings Changed`)
            .setTimestamp()
            .setFooter(`${guildId}`);
        const auditEntry = await DiscordUtils.getAuditLogEntry("GUILD_UPDATE", newGuild);
        if (auditEntry) {
            const target = auditEntry.target;
            console.log(target);
        }
    }
}