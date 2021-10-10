import {AbstractAdminAuditLogger} from "./AbstractAdminAuditLogger";
import {ArgsOf, Client, Discord, On} from "discordx";
import {DiscordUtils, GuildUtils, ObjectUtil, TimeUtils} from "../../../../utils/Utils";
import {BaseGuildTextChannel, Channel, GuildChannel, MessageEmbed, ThreadChannel} from "discord.js";
import TIME_UNIT = TimeUtils.TIME_UNIT;
import ChannelUpdate = DiscordUtils.ChannelUpdate;
import ThreadUpdate = DiscordUtils.ThreadUpdate;

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
            .setDescription(`Channel Deleted: ${channel.name}`)
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
        ChannelLogger.appendChannelTypeChanges(embed, channelUpdate);
        super.postToLog(embed, guildId);
    }

    @On("threadCreate")
    private async threadCreate([thread]: ArgsOf<"threadCreate">, client: Client): Promise<void> {
        const {guild} = thread;
        const guildId = guild.id;
        const architectTime = thread.autoArchiveDuration;
        let timeToDisplay: string;
        if (architectTime !== "MAX") {
            const millis = TimeUtils.convertToMilli(thread.autoArchiveDuration as number, TIME_UNIT.minutes);
            timeToDisplay = ObjectUtil.secondsToHuman(millis / 1000);
        } else {
            timeToDisplay = "max";
        }
        const ownerId = thread.ownerId;
        const ownerMember = thread.guild.members.cache.get(ownerId);
        const avatarUrl = ownerMember.displayAvatarURL({dynamic: true});
        const ownerTag = ownerMember.user.tag;
        const parent = thread.parent;
        const type = thread.type === "GUILD_PRIVATE_THREAD" ? "Private" : "Public";
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setAuthor(ownerTag, avatarUrl)
            .setDescription(`${type} thread Created: <#${thread.id}> (${thread.name})`)
            .setTimestamp()
            .addField("Timeout duration", timeToDisplay)
            .setFooter(`${thread.id}`);
        if (parent) {
            embed.addField("Parent channel", `<#${parent.id}>`);
        }
        embed.addField("Thread created and owned by", ownerTag);
        super.postToLog(embed, guildId);
    }

    @On("threadDelete")
    private async threadDelete([thread]: ArgsOf<"threadDelete">, client: Client): Promise<void> {
        const {guild} = thread;
        const threadAuditEntry = await DiscordUtils.getAuditLogEntry("THREAD_DELETE", guild);
        const {executor, target} = threadAuditEntry;
        const guildId = guild.id;
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setAuthor(GuildUtils.getGuildName(guildId), GuildUtils.getGuildIconUrl(guildId))
            .setDescription(`Thread Deleted: ${thread.name}`)
            .setTimestamp()
            .setFooter(`${thread.id}`);
        if (`id` in target) {
            if (target.id === thread.id) {
                if (thread.createdAt <= threadAuditEntry.createdAt) {
                    embed.addField("Thread deleted by", executor.tag);
                }
            }
        }
        super.postToLog(embed, guildId);
    }

    @On("threadUpdate")
    private async threadUpdate([oldThread, newThread]: ArgsOf<"threadUpdate">, client: Client): Promise<void> {
        if (!(oldThread instanceof ThreadChannel) || !(newThread instanceof ThreadChannel)) {
            return;
        }
        const threadUpdate = DiscordUtils.getThreadChanges(oldThread, newThread);
        if (!ObjectUtil.isValidObject(threadUpdate)) {
            return;
        }
        const {guild} = newThread;
        const guildId = guild.id;
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setAuthor(GuildUtils.getGuildName(guildId), GuildUtils.getGuildIconUrl(guildId))
            .setDescription(`Thread Updated: <#${newThread.id}>`)
            .setTimestamp()
            .setFooter(`${newThread.id}`);
        const auditEntry = await DiscordUtils.getAuditLogEntry("THREAD_UPDATE", guild);
        if (auditEntry) {
            const {target} = auditEntry;
            if (`id` in target) {
                if (target.id === newThread.id) {
                    if (newThread.createdAt <= auditEntry.createdAt) {
                        const executor = auditEntry.executor;
                        const avatarUrl = executor.displayAvatarURL({dynamic: true});
                        embed.setAuthor(executor.tag, avatarUrl);
                        embed.addField("Changed by", executor.tag);
                    }
                }
            }
        }
        ChannelLogger.appendChannelTypeChanges(embed, threadUpdate);
        super.postToLog(embed, guildId);
    }

    private static appendChannelTypeChanges(embed: MessageEmbed, update: ThreadUpdate | ChannelUpdate): void {
        for (const name in update) {
            if (update.hasOwnProperty(name)) {
                const value = update[name];
                let beforeValue = value.before ? value.before : "None";
                let afterValue = value.after ? value.after : "None";

                if (name === "archiveDuration") {
                    const oldMillis = TimeUtils.convertToMilli(beforeValue as number, TIME_UNIT.minutes);
                    const newMillis = TimeUtils.convertToMilli(afterValue as number, TIME_UNIT.minutes);
                    beforeValue = ObjectUtil.secondsToHuman(oldMillis / 1000);
                    afterValue = ObjectUtil.secondsToHuman(newMillis / 1000);
                }

                beforeValue = beforeValue.toString();
                afterValue = afterValue.toString();
                embed.addFields([
                    {
                        "name": `Old ${name}`,
                        "value": (beforeValue instanceof Channel || beforeValue instanceof BaseGuildTextChannel) ? `<#${beforeValue.id}>` : beforeValue
                    },
                    {
                        "name": `New ${name}`,
                        "value": (beforeValue instanceof Channel || beforeValue instanceof BaseGuildTextChannel) ? `<#${afterValue.id}>` : afterValue
                    }
                ]);
            }
        }
    }
}