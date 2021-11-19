import {ArgsOf, Client, Discord, On} from "discordx";
import {AbstractAdminAuditLogger} from "./AbstractAdminAuditLogger";
import {DiscordUtils, GuildUtils, ObjectUtil} from "../../../../utils/Utils";
import {Guild, MessageEmbed} from "discord.js";

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
            const target = auditEntry.target as Guild;
            if (target.id === newGuild.id) {
                if (newGuild.createdAt <= auditEntry.createdAt) {
                    const executor = auditEntry.executor;
                    const avatarUrl = executor.displayAvatarURL({dynamic: true});
                    embed.setAuthor(executor.tag, avatarUrl);
                    embed.addField("Changed by", executor.tag);
                }
            }
        }
        const {description, icon, name, discoverySplash, splash, vanityURLCode, rulesChannel, banner} = guildUpdate;
        if (ObjectUtil.isValidObject(name)) {
            const {before, after} = name;
            embed.addFields([
                {
                    "name": "Old name",
                    "value": before
                },
                {
                    "name": "New name",
                    "value": after
                }
            ]);
        }

        if (ObjectUtil.isValidObject(description)) {
            const {before, after} = description;
            embed.addFields([
                {
                    "name": "Old description",
                    "value": before
                },
                {
                    "name": "New description",
                    "value": after
                }
            ]);
        }

        if (ObjectUtil.isValidObject(banner)) {
            const {before, after} = banner;
            embed.addFields([
                {
                    "name": "Old banner",
                    "value": before
                },
                {
                    "name": "New banner",
                    "value": after
                }
            ]);
        }

        if (ObjectUtil.isValidObject(rulesChannel)) {
            const {before, after} = rulesChannel;
            embed.addFields([
                {
                    "name": "Old rules channel",
                    "value": after ? `<#${after.id}>` : "none"
                },
                {
                    "name": "New rules channel",
                    "value": before ? before.name : "none"
                }
            ]);
        }

        if (ObjectUtil.isValidObject(splash)) {
            const {before, after} = splash;
            embed.addFields([
                {
                    "name": "Old Splash image",
                    "value": before
                },
                {
                    "name": "New Splash image",
                    "value": after
                }
            ]);
        }

        if (ObjectUtil.isValidObject(discoverySplash)) {
            const {before, after} = discoverySplash;
            embed.addFields([
                {
                    "name": "Old Discovery image",
                    "value": before
                },
                {
                    "name": "New Discovery image",
                    "value": after
                }
            ]);
        }

        if (ObjectUtil.isValidObject(icon)) {
            const {before, after} = icon;
            embed.addFields([
                {
                    "name": "Old Server Icon",
                    "value": before
                },
                {
                    "name": "New Server Icon",
                    "value": after
                }
            ]);
        }

        if (ObjectUtil.isValidObject(vanityURLCode)) {
            const {before, after} = vanityURLCode;
            embed.addFields([
                {
                    "name": "Old Vanity URL",
                    "value": before
                },
                {
                    "name": "New Vanity URL",
                    "value": after
                }
            ]);
        }
        super.postToLog(embed, guildId);
    }
}