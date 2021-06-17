import {Command, CommandMessage, Description, Guard} from "@typeit/discord";
import {NotBot} from "../../guards/NotABot";
import {secureCommand} from "../../guards/RoleConstraint";
import {DiscordUtils, ObjectUtil, StringUtils} from "../../utils/Utils";
import {BannedAttachmentsModel} from "../../model/DB/BannedAttachments.model";
import {Collection, Message, Snowflake} from "discord.js";
import {AbstractCommandModule} from "../AbstractCommandModule";

const getUrls = require('get-urls');
const md5 = require('md5');
import EmojiInfo = DiscordUtils.EmojiInfo;


export abstract class ResourceBanner extends AbstractCommandModule<BannedAttachmentsModel> {

    constructor() {
        super({
            module: {
                name: "ResourceBanner",
                description: "Commands deal with banning attachments, embeds and emojis from messages"
            },
            commands: [
                {
                    name: "banAttachment",
                    description: {
                        text: "This command is used to ban an attachment, to use it, reply to a message and use {prefix}banAttachment \n banning an attachment means that if it is posted again, it is automatically deleted and logged",
                        examples: ["banAttachment = while replying to a message you wish to ban"],
                    }
                },
                {
                    name: "banEmoji",
                    description: {
                        text: "This command is used to ban emojis from other servers, to use it, reply to a message that contains the emoji you want banned, if the replied message contains more than one emoji, this bot will ask you what one you wish to ban",
                    }
                }
            ]
        });
    }


    @Command("banEmoji")
    @Guard(NotBot, secureCommand)
    private async banEmoji(command: CommandMessage): Promise<void> {
        const repliedMessageLink = command.reference;
        if (!repliedMessageLink) {
            command.reply("Please reply to a message");
            return;
        }
        const argumentArray = StringUtils.splitCommandLine(command.content);
        if (argumentArray.length !== 1) {
            command.reply("Please supply a reason");
            return;
        }
        const reason: string = argumentArray[0];
        const repliedMessageID = repliedMessageLink.messageID;
        const repliedMessageObj = await command.channel.messages.fetch(repliedMessageID);
        const emojisFromMessage = DiscordUtils.getEmojiFromMessage(repliedMessageObj, false);
        if (emojisFromMessage.length === 0) {
            command.reply("Message contains no external emoji");
            return;
        }
        let emojiId: string = null;
        if (emojisFromMessage.length > 1) {
            const emojiMap: Map<string, string> = new Map();
            const aCharCode = 'A'.charCodeAt(0);
            for (let i = 0; i < emojisFromMessage.length; i++) {
                const emoji = emojisFromMessage[i];
                const letter = String.fromCharCode(i + aCharCode);
                emojiMap.set(letter, emoji);
            }
            let reply = "";
            emojiMap.forEach((value, key) => {
                reply += `${key}: ${value} \n`;
            });
            await command.reply(`What emoji would you like to ban: \n${reply}`);
            const filter = (response: Message): boolean => {
                if (!response.member || !command.member) {
                    return false;
                }
                return response.member.id === command.member.id && emojiMap.has(response.content.toUpperCase());
            };
            let collected: Collection<Snowflake, Message> = null;
            try {
                collected = await command.channel.awaitMessages(filter, {max: 1, time: 10000, errors: ['time']});
            } catch {
                command.reply("Timout exceeded.");
                return;
            }
            const result = collected.first().content.toUpperCase();
            const emojiRef = emojiMap.get(result);
            emojiId = emojiRef.split(":").pop().slice(0, -1);
        } else {
            emojiId = emojisFromMessage[0].split(":").pop().slice(0, -1);
        }

        const findMessage = await command.reply("Please wait while i extract the emoji...");
        let emojiInfo: EmojiInfo = null;
        try {
            emojiInfo = await DiscordUtils.getEmojiInfo(emojiId);
        } catch {
            await findMessage.delete();
            command.reply("Error finding emoji");
            return;
        }

        await ResourceBanner.doBanAttachment(emojiInfo.buffer, reason, emojiInfo.url, command.guild.id, true);
        await findMessage.delete();
        await command.reply("Emoji added to ban database");
        repliedMessageObj.delete();
    }

    public static async doBanAttachment(attachment: Buffer, reason: string, url: string, guildId: string, isEmoji = false): Promise<BannedAttachmentsModel> {
        const attachmentHash = md5(attachment);
        const exists = await BannedAttachmentsModel.count({
            where: {
                attachmentHash,
                guildId
            }
        }) === 1;
        if (exists) {
            return null;
        }
        const entry = new BannedAttachmentsModel({
            attachmentHash,
            url,
            reason,
            guildId,
            isEmoji
        });
        return await entry.save();
    }

    @Command("banAttachment")
    @Description(ResourceBanner.viewDescriptionForSetUsernames())
    @Guard(NotBot, secureCommand)
    private async banAttachment(command: CommandMessage): Promise<void> {
        const repliedMessageRef = command.reference;
        if (!repliedMessageRef) {
            command.reply("Please reply to a message that contains an attachment");
            return;
        }
        const argumentArray = StringUtils.splitCommandLine(command.content);
        if (argumentArray.length !== 1) {
            command.reply("Please supply a reason");
            return;
        }
        const reason: string = argumentArray[0];
        const repliedMessageID = repliedMessageRef.messageID;
        const repliedMessageObj = await command.channel.messages.fetch(repliedMessageID);
        let urlsInMessage: Set<string> = null;
        const repliedMessageContent = repliedMessageObj.content;
        if (ObjectUtil.validString(repliedMessageContent)) {
            urlsInMessage = getUrls(repliedMessageObj.content);
        }
        const attatchmentArray = repliedMessageObj.attachments;
        if (attatchmentArray.size === 0 && urlsInMessage.size === 0) {
            command.reply("Linked message contains no attachments");
            return;
        }
        const waitMessage = await command.channel.send("Extracting attachments...");
        const urls = attatchmentArray.map(value => (value.attachment as string));
        if (urlsInMessage && urlsInMessage.size > 0) {
            urls.push(...urlsInMessage.values());
        }
        let successful = 0;
        for (const urlToAttachment of urls) {
            try {
                const attachment = await DiscordUtils.loadResourceFromURL(urlToAttachment);
                await ResourceBanner.doBanAttachment(attachment, reason, urlToAttachment, command.guild.id);
                successful++;
            } catch (e) {
                await command.reply(`Error extracting attachment"`);
                console.error(e);
            }
        }
        if (successful === 0) {
            command.reply("no attachments extracted, see above errors");
            return;
        }
        try {
            await waitMessage.delete();
            await repliedMessageObj.delete();
        } catch {
        }

        command.reply("attachments extracted, any more messages with these attachments will be auto deleted");
    }

    private static viewDescriptionForSetUsernames() {
        return "Ban the attachment that is contained in the linked messages \n usage: ~banAttachment <reason>";
    }
}