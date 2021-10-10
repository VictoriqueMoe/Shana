import {AbstractAdminAuditLogger} from "./AbstractAdminAuditLogger";
import {ArgsOf, Client, Discord, On} from "discordx";
import {DiscordUtils, GuildUtils, ObjectUtil} from "../../../../utils/Utils";
import {BaseGuildTextChannel, CategoryChannel, Channel, GuildChannel, MessageEmbed} from "discord.js";

/**
 * Will log: <br/>
 * Channel Create<br/>
 * Channel Delete<br/>
 * Channel Updated<br/>
 * Thread Create<br/>
 * Thread Delete<br/>
 * Thread Update<br/>
 */
@Discord()
export class ChannelLogger extends AbstractAdminAuditLogger {

    @On("channelCreate")
    private async channelCreated([channel]: ArgsOf<"channelCreate">, client: Client): Promise<void> {
        const {guild} = channel;
        const channelAudiEntry = await DiscordUtils.getAuditLogEntry("CHANNEL_CREATE", guild);
        const {executor, target} = channelAudiEntry;
        const guildId = guild.id;
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setAuthor(GuildUtils.getGuildName(guildId), GuildUtils.getGuildIconUrl(guildId))
            .setDescription(`Channel Created: <#${channel.id}> (${channel.name})`)
            .setTimestamp()
            .setFooter(`${channel.id}`);
        if (target instanceof Channel) {
            if (target.id === channel.id) {
                if (channel.createdAt <= channelAudiEntry.createdAt) {
                    embed.addField("Channel created by", executor.tag);
                }
            }
        }
        super.postToLog(embed, guildId);
    }

    @On("channelDelete")
    private async channelDelete([channel]: ArgsOf<"channelDelete">, client: Client): Promise<void> {
        if (!(channel instanceof BaseGuildTextChannel)) {
            return;
        }
        const {guild} = channel;
        const channelAudiEntry = await DiscordUtils.getAuditLogEntry("CHANNEL_DELETE", guild);
        const {executor, target} = channelAudiEntry;
        const guildId = guild.id;
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setAuthor(GuildUtils.getGuildName(guildId), GuildUtils.getGuildIconUrl(guildId))
            .setDescription(`Channel Deleted: (${channel.name})`)
            .setTimestamp()
            .setFooter(`${channel.id}`);
        if (`id` in target) {
            if (target.id === channel.id) {
                if (channel.createdAt <= channelAudiEntry.createdAt) {
                    embed.addField("Channel deleted by", executor.tag);
                }
            }
        }
        super.postToLog(embed, guildId);
    }

    @On("channelUpdate")
    private async channelUpdate([oldChannel, newChannel]: ArgsOf<"channelUpdate">, client: Client): Promise<void> {
        if (!(oldChannel instanceof GuildChannel) || !(newChannel instanceof GuildChannel)) {
            return;
        }
        const channelUpdate = DiscordUtils.getChannelChanges(oldChannel, newChannel);
        if (!ObjectUtil.isValidObject(channelUpdate)) {
            return;
        }
        const {guild} = newChannel;
        const guildId = guild.id;
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setAuthor(GuildUtils.getGuildName(guildId), GuildUtils.getGuildIconUrl(guildId))
            .setDescription(`Channel Updated: <#${newChannel.id}>`)
            .setTimestamp()
            .setFooter(`${newChannel.id}`);
        const auditEntry = await DiscordUtils.getAuditLogEntry("CHANNEL_UPDATE", guild);
        if (auditEntry) {
            const {target} = auditEntry;
            if (`id` in target) {
                if (target.id === newChannel.id) {
                    if (newChannel.createdAt <= auditEntry.createdAt) {
                        const executor = auditEntry.executor;
                        const avatarUrl = executor.displayAvatarURL({dynamic: true});
                        embed.setAuthor(executor.tag, avatarUrl);
                        embed.addField("Changed by", executor.tag);
                    }
                }
            }
        }
        for (const name in channelUpdate) {
            if (channelUpdate.hasOwnProperty(name)) {
                const value = channelUpdate[name];
                let beforeValue = value.before ? value.before : "None";
                let afterValue = value.after ? value.after : "None";
                if (typeof beforeValue === "number") {
                    beforeValue = beforeValue.toString();
                }
                if (typeof afterValue === "number") {
                    afterValue = afterValue.toString();
                }
                embed.addFields([
                    {
                        "name": `Old ${name}`,
                        "value": beforeValue instanceof CategoryChannel ? `<#${beforeValue.id}>` : beforeValue
                    },
                    {
                        "name": `New ${name}`,
                        "value": afterValue instanceof CategoryChannel ? `<#${afterValue.id}>` : afterValue
                    }
                ]);
            }
        }
        super.postToLog(embed, guildId);
    }
}