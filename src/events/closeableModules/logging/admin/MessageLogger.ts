import {ArgsOf, Client, Guard, On} from "@typeit/discord";
import {EnabledGuard} from "../../../../guards/EnabledGuard";
import {DiscordUtils, GuildUtils, ObjectUtil} from "../../../../utils/Utils";
import {MessageEmbed, User} from "discord.js";
import {Main} from "../../../../Main";
import {AbstractAdminAuditLogger} from "./AbstractAdminAuditLogger";

/**
 * Message Edited
 * Messaged Deleted
 * Bulk Message Deletion
 */
export class MessageLogger extends AbstractAdminAuditLogger {
    private static _uid = ObjectUtil.guid();

    constructor() {
        super(MessageLogger._uid);
    }

    @On("messageUpdate")
    @Guard(EnabledGuard("AdminLog"))
    private async messageEdited([oldMessage, newMessage]: ArgsOf<"messageUpdate">, client: Client): Promise<void> {
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
        const avatarUrl = member.user.displayAvatarURL({format: 'jpg'});
        const embed = new MessageEmbed()
            .setColor('#337FD5')
            .setAuthor(`${member.user.tag}`, avatarUrl)
            .setDescription(`Message edited in <#${newMessage.channel.id}> [Jump to Message](${newMessage.url})`)
            .addFields({
                    name: "before",
                    value: ObjectUtil.validString(messageBefore) ? messageBefore : "none"
                },
                {
                    name: "After",
                    value: ObjectUtil.validString(messageAfter) ? messageAfter : "none"
                })
            .setTimestamp()
            .setFooter(`${member.id}`);
        super.postToLog(embed, member.guild.id);
    }


    @On("messageDelete")
    @Guard(EnabledGuard("AdminLog"))
    private async messageDeleted([message]: ArgsOf<"messageDelete">, client: Client): Promise<void> {
        if (message.member.id === Main.client.user.id) {
            return;
        }
        const limit = 2048;
        const truncate = (input) => input.length > limit ? `${input.substring(0, limit - 3)}...` : input;
        const member = message.member;
        const avatarUrl = member.user.displayAvatarURL({format: 'jpg'});
        const messageContent = message.content;
        const description = truncate(`Message sent by <@${member.id}> deleted in <#${message.channel.id}> \n ${messageContent}`);
        const embed = new MessageEmbed()
            .setColor('#FF470F')
            .setAuthor(`${member.user.tag}`, avatarUrl)
            .setDescription(description)
            .setTimestamp()
            .setFooter(`${member.id}`);
        try {
            const deleteMessageLog = await DiscordUtils.getAuditLogEntry("MESSAGE_DELETE", message.guild);
            const target = deleteMessageLog.target;
            if (target instanceof User) {
                if (target.id === member.user.id) {
                    embed.addField("deleted by", `${deleteMessageLog.executor.tag}`);
                }
            }
        } catch {
        }

        super.postToLog(embed, message.guild.id);
    }

    @On("messageDeleteBulk")
    @Guard(EnabledGuard("AdminLog"))
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