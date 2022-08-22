import {AbstractAdminAuditLogger} from "./AbstractAdminAuditLogger.js";
import {
    AuditLogEvent,
    BaseChannel,
    BaseGuildTextChannel,
    ChannelType,
    EmbedBuilder,
    GuildChannel,
    ThreadAutoArchiveDuration,
    ThreadChannel
} from "discord.js";
import {ArgsOf, Discord, On} from "discordx";
import {Typeings} from "../../../../../model/Typeings.js";
import {ObjectUtil} from "../../../../../utils/Utils.js";
import TIME_UNIT from "../../../../../enums/TIME_UNIT.js";
import {
    ChannelLoggerSettings
} from "../../../../../model/closeableModules/settings/AdminLogger/ChannelLoggerSettings.js";
import ChannelUpdate = Typeings.ChannelUpdate;
import ThreadUpdate = Typeings.ThreadUpdate;

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
export class ChannelLogger extends AbstractAdminAuditLogger<ChannelLoggerSettings> {

    private static appendChannelTypeChanges(embed: EmbedBuilder, update: ThreadUpdate | ChannelUpdate): void {
        for (const name in update) {
            if (Object.prototype.hasOwnProperty.call(update, name)) {
                const value = update[name];
                let beforeValue = value.before ? value.before : "None";
                let afterValue = value.after ? value.after : "None";

                if (name === "archiveDuration") {
                    const oldMillis = ObjectUtil.convertToMilli(beforeValue as ThreadAutoArchiveDuration, TIME_UNIT.minutes);
                    const newMillis = ObjectUtil.convertToMilli(afterValue as ThreadAutoArchiveDuration, TIME_UNIT.minutes);
                    beforeValue = ObjectUtil.timeToHuman(oldMillis);
                    afterValue = ObjectUtil.timeToHuman(newMillis);
                }

                beforeValue = beforeValue.toString();
                afterValue = afterValue.toString();
                embed.addFields([
                    {
                        "name": `Old ${name}`,
                        "value": (beforeValue instanceof BaseChannel) ? `<#${beforeValue.id}>` : beforeValue
                    },
                    {
                        "name": `New ${name}`,
                        "value": (beforeValue instanceof BaseChannel) ? `<#${afterValue.id}>` : afterValue
                    }
                ]);
            }
        }
    }

    public override setDefaults(guildId: string): Promise<void> {
        return this.saveSettings(guildId, {
            channelCreated: false,
            channelDelete: false,
            channelUpdate: false,
            threadCreate: false,
            threadDelete: false,
            threadUpdate: false
        }, false, true);
    }

    @On({
        event: "channelCreate"
    })
    private async channelCreated([channel]: ArgsOf<"channelCreate">): Promise<void> {
        const enabled = await this.isEnabledInternal(channel.guildId, "channelCreated");
        if (!enabled) {
            return;
        }
        const {guild} = channel;
        const channelAudiEntry = await this._auditManager.getAuditLogEntry(AuditLogEvent.ChannelCreate, guild);
        const {executor, target} = channelAudiEntry;
        const guildId = guild.id;
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setAuthor({
                name: this.getGuildName(guildId),
                iconURL: this.getGuildIconUrl(guildId)
            })
            .setDescription(`Channel Created: <#${channel.id}> (${channel.name})`)
            .setTimestamp()
            .setFooter({
                text: `${channel.id}`
            });
        if (target instanceof GuildChannel) {
            if (target.id === channel.id) {
                if (channel.createdAt <= channelAudiEntry.createdAt) {
                    embed.addFields(ObjectUtil.singleFieldBuilder("Channel created by", executor.tag));
                }
            }
        }
        super.postToLog(embed, guildId);
    }

    @On({
        event: "channelDelete"
    })
    private async channelDelete([channel]: ArgsOf<"channelDelete">): Promise<void> {
        if (!(channel instanceof BaseGuildTextChannel)) {
            return;
        }
        const enabled = await this.isEnabledInternal(channel.guildId, "channelDelete");
        if (!enabled) {
            return;
        }
        const {guild} = channel;
        const channelAudiEntry = await this._auditManager.getAuditLogEntry(AuditLogEvent.ChannelDelete, guild);
        const {executor, target} = channelAudiEntry;
        const guildId = guild.id;
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setAuthor({
                name: this.getGuildName(guildId),
                iconURL: this.getGuildIconUrl(guildId)
            })
            .setDescription(`Channel Deleted: ${channel.name}`)
            .setTimestamp()
            .setFooter({
                text: `${channel.id}`
            });
        if (`id` in target) {
            if (target.id === channel.id) {
                if (channel.createdAt <= channelAudiEntry.createdAt) {
                    embed.addFields(ObjectUtil.singleFieldBuilder("Channel deleted by", executor.tag));
                }
            }
        }
        super.postToLog(embed, guildId);
    }

    @On({
        event: "channelUpdate"
    })
    private async channelUpdate([oldChannel, newChannel]: ArgsOf<"channelUpdate">): Promise<void> {
        if (!(oldChannel instanceof GuildChannel) || !(newChannel instanceof GuildChannel)) {
            return;
        }
        const enabled = await this.isEnabledInternal(newChannel.guildId, "channelUpdate");
        if (!enabled) {
            return;
        }
        const channelUpdate = this._guildInfoChangeManager.getChannelChanges(oldChannel, newChannel);
        if (!ObjectUtil.isValidObject(channelUpdate)) {
            return;
        }
        const {guild} = newChannel;
        const guildId = guild.id;
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setAuthor({
                name: this.getGuildName(guildId),
                iconURL: this.getGuildIconUrl(guildId)
            })
            .setDescription(`Channel Updated: <#${newChannel.id}>`)
            .setTimestamp()
            .setFooter({
                text: `${newChannel.id}`
            });
        const auditEntry = await this._auditManager.getAuditLogEntry(AuditLogEvent.ChannelUpdate, guild);
        if (auditEntry) {
            const {target} = auditEntry;
            if (`id` in target) {
                if (target.id === newChannel.id) {
                    if (newChannel.createdAt <= auditEntry.createdAt) {
                        const executor = auditEntry.executor;
                        const avatarUrl = executor.displayAvatarURL();
                        embed.setAuthor({
                            name: executor.tag,
                            iconURL: avatarUrl

                        });
                        embed.addFields(ObjectUtil.singleFieldBuilder("Changed by", executor.tag));
                    }
                }
            }
        }
        ChannelLogger.appendChannelTypeChanges(embed, channelUpdate);
        super.postToLog(embed, guildId);
    }

    @On({
        event: "threadCreate"
    })
    private async threadCreate([thread]: ArgsOf<"threadCreate">): Promise<void> {
        const enabled = await this.isEnabledInternal(thread.guildId, "threadCreate");
        if (!enabled) {
            return;
        }
        const {guild} = thread;
        const guildId = guild.id;
        const architectTime = thread.autoArchiveDuration;
        let timeToDisplay: string;
        if (architectTime) {
            const millis = ObjectUtil.convertToMilli(thread.autoArchiveDuration as number, TIME_UNIT.minutes);
            timeToDisplay = ObjectUtil.timeToHuman(millis);
        } else {
            timeToDisplay = "max";
        }
        const ownerId = thread.ownerId;
        const ownerMember = thread.guild.members.cache.get(ownerId);
        const avatarUrl = ownerMember.displayAvatarURL();
        const ownerTag = ownerMember.user.tag;
        const parent = thread.parent;
        const type = thread.type === ChannelType.GuildPrivateThread ? "Private" : "Public";
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setAuthor({
                name: ownerTag,
                iconURL: avatarUrl
            })
            .setDescription(`${type} thread Created: <#${thread.id}> (${thread.name})`)
            .setTimestamp()
            .addFields(ObjectUtil.singleFieldBuilder("Timeout duration", timeToDisplay))
            .setFooter({
                text: `${thread.id}`
            });
        if (parent) {
            embed.addFields(ObjectUtil.singleFieldBuilder("Parent channel", `<#${parent.id}>`));
        }
        embed.addFields(ObjectUtil.singleFieldBuilder("Thread created and owned by", ownerTag));
        super.postToLog(embed, guildId);
    }

    @On({
        event: "threadDelete"
    })
    private async threadDelete([thread]: ArgsOf<"threadDelete">): Promise<void> {
        const enabled = await this.isEnabledInternal(thread.guildId, "threadDelete");
        if (!enabled) {
            return;
        }
        const {guild} = thread;
        const threadAuditEntry = await this._auditManager.getAuditLogEntry(AuditLogEvent.ThreadDelete, guild);
        const {executor, target} = threadAuditEntry;
        const guildId = guild.id;
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setAuthor({
                name: this.getGuildName(guildId),
                iconURL: this.getGuildIconUrl(guildId)
            })
            .setDescription(`Thread Deleted: ${thread.name}`)
            .setTimestamp()
            .setFooter({
                text: `${thread.id}`
            });
        if (`id` in target) {
            if (target.id === thread.id) {
                if (thread.createdAt <= threadAuditEntry.createdAt) {
                    embed.addFields(ObjectUtil.singleFieldBuilder("Thread deleted by", executor.tag));
                }
            }
        }
        super.postToLog(embed, guildId);
    }

    @On({
        event: "threadUpdate"
    })
    private async threadUpdate([oldThread, newThread]: ArgsOf<"threadUpdate">): Promise<void> {
        if (!(oldThread instanceof ThreadChannel) || !(newThread instanceof ThreadChannel)) {
            return;
        }
        const enabled = await this.isEnabledInternal(newThread.guildId, "threadUpdate");
        if (!enabled) {
            return;
        }
        const threadUpdate = this._guildInfoChangeManager.getThreadChanges(oldThread, newThread);
        if (!ObjectUtil.isValidObject(threadUpdate)) {
            return;
        }
        const {guild} = newThread;
        const guildId = guild.id;
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setAuthor({
                name: this.getGuildName(guildId),
                iconURL: this.getGuildIconUrl(guildId)
            })
            .setDescription(`Thread Updated: <#${newThread.id}>`)
            .setTimestamp()
            .setFooter({
                text: `${newThread.id}`
            });
        const auditEntry = await this._auditManager.getAuditLogEntry(AuditLogEvent.ThreadUpdate, guild);
        if (auditEntry) {
            const {target} = auditEntry;
            if (`id` in target) {
                if (target.id === newThread.id) {
                    if (newThread.createdAt <= auditEntry.createdAt) {
                        const executor = auditEntry.executor;
                        const avatarUrl = executor.displayAvatarURL();
                        embed.setAuthor({
                            name: executor.tag,
                            iconURL: avatarUrl
                        });
                        embed.addFields(ObjectUtil.singleFieldBuilder("Changed by", executor.tag));
                    }
                }
            }
        }
        ChannelLogger.appendChannelTypeChanges(embed, threadUpdate);
        super.postToLog(embed, guildId);
    }
}
