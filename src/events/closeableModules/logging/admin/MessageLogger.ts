import {CloseableModule} from "../../../../model/closeableModules/impl/CloseableModule";
import {CloseOptionModel} from "../../../../model/DB/autoMod/impl/CloseOption.model";
import {ArgsOf, Client, Guard, On} from "@typeit/discord";
import {EnabledGuard} from "../../../../guards/EnabledGuard";
import {DiscordUtils, ObjectUtil} from "../../../../utils/Utils";
import {MessageEmbed} from "discord.js";
import {Main} from "../../../../Main";

/**
 * Message Edited
 * Messaged Deleted
 * Bulk Message Deletion
 */
export class MessageLogger extends CloseableModule {
    private static _uid = ObjectUtil.guid();

    constructor() {
        super(CloseOptionModel, MessageLogger._uid);
    }

    @On("messageUpdate")
    @Guard(EnabledGuard("AdminLog"))
    private async messageEdited([oldMessage, newMessage]: ArgsOf<"messageUpdate">, client: Client): Promise<void> {
        if (newMessage.member.id === Main.client.user.id) {
            return;
        }
        const messageBefore = oldMessage.content;
        const messageAfter = newMessage.content;
        if(!ObjectUtil.validString(messageBefore) && !ObjectUtil.validString(messageAfter) || (messageBefore === messageAfter)){
            return;
        }
        const member = newMessage.member;
        const avatarUrl = member.user.displayAvatarURL({format: 'jpg'});
        const userJoinEmbed = new MessageEmbed()
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
        DiscordUtils.postToAdminLog(userJoinEmbed);
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
        const description = truncate(`Message sent by <@${member.id}> deleted in <#${message.channel.id}> \n ${truncate(messageContent)}`);
        const userJoinEmbed = new MessageEmbed()
            .setColor('#FF470F')
            .setAuthor(`${member.user.tag}`, avatarUrl)
            .setDescription(description)
            .setTimestamp()
            .setFooter(`${member.id}`);
        DiscordUtils.postToAdminLog(userJoinEmbed);
    }

    get isDynoReplacement(): boolean {
        return true;
    }

    get moduleId(): string {
        return "AdminLog";
    }

}