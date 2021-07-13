import {ArgsOf, Client, On} from "@typeit/discord";
import {DiscordUtils, GuildUtils, ObjectUtil, StringUtils} from "../../../../utils/Utils";
import {MessageEmbed, Util} from "discord.js";
import {Main} from "../../../../Main";
import {AbstractAdminAuditLogger} from "./AbstractAdminAuditLogger";
import {Imgur} from "../../../../model/Imgur";

const isImageFast = require('is-image-fast');

/**
 * Message Edited
 * Messaged Deleted
 * Bulk Message Deletion
 */
export class MessageLogger extends AbstractAdminAuditLogger {
    private static _uid = ObjectUtil.guid();
    private imgur = new Imgur();
    private static messageLimit = 1024;

    constructor() {
        super(MessageLogger._uid);
    }

    @On("messageUpdate")
    private async messageEdited([oldMessage, newMessage]: ArgsOf<"messageUpdate">, client: Client): Promise<void> {
        if (!newMessage.member) {
            return;
        }
        if (newMessage.member.id === Main.client.user.id) {
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
        const avatarUrl = member.user.displayAvatarURL({format: 'jpg'});
        const embed = new MessageEmbed()
            .setColor('#337FD5')
            .setAuthor(`${member.user.tag}`, avatarUrl)
            .setDescription(`Message edited in <#${newMessage.channel.id}> [Jump to Message](${newMessage.url})`)
            .addFields({
                    name: "before",
                    value: ObjectUtil.validString(messageBefore) ? StringUtils.truncate(messageBefore, MessageLogger.messageLimit) : "none"
                },
                {
                    name: "After",
                    value: ObjectUtil.validString(messageAfter) ? StringUtils.truncate(messageAfter, MessageLogger.messageLimit) : "none"
                })
            .setTimestamp()
            .setFooter(`${member.id}`);
        super.postToLog(embed, member.guild.id, newMessage.member);
    }


    @On("messageDelete")
    private async messageDeleted([message]: ArgsOf<"messageDelete">, client: Client): Promise<void> {
        if (!Main.testMode && message.member && message.member.id === Main.client.user.id) {
            return;
        }
        const dateNow = Date.now();
        const attatchments = message.attachments;
        const member = message.member;
        if (!member || !member.user) {
            return;
        }
        await Util.delayFor(900);
        const fetchedLogs = await DiscordUtils.getAuditLogEntries("MESSAGE_DELETE", message.guild, 6);
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

        const avatarUrl = member.user.displayAvatarURL({format: 'jpg'});
        const messageContent = message.content;
        const description = StringUtils.truncate(`Message sent by <@${member.id}> deleted in <#${message.channel.id}> \n ${messageContent}`, MessageLogger.messageLimit);
        const embed = new MessageEmbed()
            .setColor('#FF470F')
            .setAuthor(`${member.user.tag}`, avatarUrl)
            .setDescription(description)
            .setTimestamp()
            .setFooter(`${member.id}`);
        if (ObjectUtil.validString(executor)) {
            embed.addField("Deleted by", executor);
        }
        if (attatchments.size === 1) {
            const messageAttachment = attatchments.first();
            const url = messageAttachment.attachment as string;
            try {
                if (ObjectUtil.validString(url)) {
                    const isImage: boolean = await isImageFast(url);
                    if (isImage) {
                        const newUrl = await this.imgur.uploadImageFromUrl(url);
                        embed.setImage(newUrl);
                    }
                }
            } catch {
            }
        }
        super.postToLog(embed, message.guild.id, message.member);
    }

    @On("messageDeleteBulk")
    private async bulkDelete([collection]: ArgsOf<"messageDeleteBulk">, client: Client): Promise<void> {
        const len = collection.size;
        const channelSet: Set<string> = new Set();
        const guildId: string = collection.array()[0].guild.id;
        collection.forEach(({id}) => channelSet.add(id));
        const channelIdArray = Array.from(channelSet.entries());
        const description = `Bulk Delete in ${channelIdArray.map(id => `<#${id}>`).join(", ")}, ${len} messages deleted`;
        const embed = new MessageEmbed()
            .setColor('#337FD5')
            .setAuthor(GuildUtils.getGuildName(guildId), GuildUtils.getGuildIconUrl(guildId))
            .setDescription(description)
            .setTimestamp();
        super.postToLog(embed, guildId);
    }
}