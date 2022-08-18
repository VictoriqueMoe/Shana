import {ObjectUtil} from "../../../../../utils/Utils.js";
import {AbstractAdminAuditLogger} from "./AbstractAdminAuditLogger.js";
import {injectable} from "tsyringe";
import {ArgsOf, Client, Discord, On} from "discordx";
import {ImgurManager} from "../../../../../model/framework/manager/ImgurManager.js";
import {AuditLogEvent, EmbedBuilder, StickerFormatType} from "discord.js";
import isImageFast from "is-image-fast";
import {
    MessageLoggerSettings
} from "../../../../../model/closeableModules/settings/AdminLogger/MessageLoggerSettings.js";

/**
 * Message Edited<br/>
 * Messaged Deleted<br/>
 * Bulk Message Deletion<br/>
 */
@Discord()
@injectable()
export class MessageLogger extends AbstractAdminAuditLogger<MessageLoggerSettings> {
    private static messageLimit = 1024;

    public constructor(private _imgur: ImgurManager) {
        super();
    }

    public get moduleId(): string {
        return "MessageLogger";
    }

    public setDefaults(guildId: string): Promise<void> {
        return super.saveSettings(guildId, {
            bulkDelete: false,
            messageDeleted: false,
            messageEdited: false
        });
    }

    @On({
        event: "messageUpdate"
    })
    private async messageEdited([oldMessage, newMessage]: ArgsOf<"messageUpdate">, client: Client): Promise<void> {
        if (!newMessage.member) {
            return;
        }
        if (newMessage.member.id === client.user.id) {
            return;
        }
        const messageBefore = oldMessage.content;
        const messageAfter = newMessage.content;
        if (!ObjectUtil.validString(messageBefore) && !ObjectUtil.validString(messageAfter)) {
            return;
        }

        if (messageBefore === messageAfter) {
            return;
        }
        const member = newMessage.member;
        if (!member) {
            return;
        }
        const avatarUrl = member.user.displayAvatarURL({extension: "jpg"});
        const embed = new EmbedBuilder()
            .setColor('#337FD5')
            .setAuthor({
                name: `${member.user.tag}`,
                iconURL: avatarUrl
            })
            .setDescription(`Message edited in <#${newMessage.channel.id}> [Jump to Message](${newMessage.url})`)
            .addFields({
                    name: "before",
                    value: ObjectUtil.validString(messageBefore) ? ObjectUtil.truncate(messageBefore, MessageLogger.messageLimit) : "none"
                },
                {
                    name: "After",
                    value: ObjectUtil.validString(messageAfter) ? ObjectUtil.truncate(messageAfter, MessageLogger.messageLimit) : "none"
                })
            .setTimestamp()
            .setFooter({
                text: `${member.id}`
            });
        super.postToLog(embed, member.guild.id);
    }


    @On({
        event: "messageDelete"
    })
    private async messageDeleted([message]: ArgsOf<"messageDelete">, client: Client): Promise<void> {
        if (message?.member?.id === client.user.id) {
            return;
        }
        const dateNow = Date.now();
        const attatchments = message.attachments;
        const member = message.member;
        if (!member || !member.user) {
            return;
        }
        await ObjectUtil.delayFor(900);
        const fetchedLogs = await this._auditManager.getAuditLogEntries(AuditLogEvent.MessageDelete, message.guild, 6);
        let executor = null;
        if (fetchedLogs) {
            const auditEntry = fetchedLogs.entries.find(auditEntry => {
                    const d = dateNow - auditEntry.createdTimestamp;
                    const dateConstraint = d < 40000;
                    // @ts-ignore
                    return auditEntry.target && auditEntry.target.id === message.author.id && auditEntry.extra.channel.id === message.channel.id && dateConstraint;
                }
            );
            executor = auditEntry ? auditEntry.executor.tag : '';
        }

        const avatarUrl = member.user.displayAvatarURL();
        const messageContent = message.content;
        const stickers = message.stickers;
        const description = ObjectUtil.truncate(`Message sent by <@${member.id}> deleted in <#${message.channel.id}> \n ${messageContent}`, MessageLogger.messageLimit);
        const embed = new EmbedBuilder()
            .setColor('#FF470F')
            .setAuthor({
                name: `${member.user.tag}`,
                iconURL: avatarUrl
            })
            .setDescription(description)
            .setTimestamp()
            .setFooter({
                text: `${member.id}`
            });
        if (ObjectUtil.validString(executor)) {
            embed.addFields(ObjectUtil.singleFieldBuilder("Deleted by", executor));
        }
        if (attatchments.size === 1 && this._imgur.enabled) {
            const messageAttachment = attatchments.first();
            const url = messageAttachment.attachment as string;
            try {
                if (ObjectUtil.validString(url)) {
                    const isImage: boolean = await isImageFast(url);
                    if (isImage) {
                        const newUrl = await this._imgur.uploadImageFromUrl(url);
                        embed.setImage(newUrl);
                    }
                }
            } catch {
            }
        }
        if (stickers.size > 0) {
            const stickerUrls: string[] = [];
            for (const [, sticker] of stickers) {
                if (sticker.format === StickerFormatType.Lottie) {
                    continue;
                }
                stickerUrls.push(sticker.url);
            }
            if (ObjectUtil.isValidArray(stickerUrls)) {
                embed.addFields(ObjectUtil.singleFieldBuilder("Stickers", stickerUrls.join("\n")));
            }
        }
        super.postToLog(embed, message.guild.id);
    }

    @On({
        event: "messageDeleteBulk"
    })
    private async bulkDelete([collection]: ArgsOf<"messageDeleteBulk">): Promise<void> {
        const len = collection.size;
        const channelSet: Set<string> = new Set();
        const guildId: string = collection.first().guild.id;
        collection.forEach(({id}) => channelSet.add(id));
        const channelIdArray = Array.from(channelSet.entries());
        const description = `Bulk Delete in ${channelIdArray.map(id => `<#${id}>`).join(", ")}, ${len} messages deleted`;
        const embed = new EmbedBuilder()
            .setColor('#337FD5')
            .setAuthor({
                name: this.getGuildName(guildId),
                iconURL: this.getGuildIconUrl(guildId)
            })
            .setDescription(description)
            .setTimestamp();
        super.postToLog(embed, guildId);
    }
}