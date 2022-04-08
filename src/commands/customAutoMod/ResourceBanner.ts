import {DefaultPermissionResolver, Discord, Guard, Permission, SimpleCommand, SimpleCommandMessage} from "discordx";
import {DiscordUtils, ObjectUtil, StringUtils} from "../../utils/Utils";
import {BannedAttachmentsModel} from "../../model/DB/guild/BannedAttachments.model";
import {Collection, Message, Snowflake, Sticker} from "discord.js";
import {AbstractCommand} from "../AbstractCommand";
import {NotBot} from "@discordx/utilities";
import {CommandEnabled} from "../../guards/CommandEnabled";
import {Category} from "../../modules/category";
import {getRepository} from "typeorm";
import {BaseDAO} from "../../DAO/BaseDAO";

const md5 = require('md5');
import EmojiInfo = DiscordUtils.EmojiInfo;
import StickerInfo = DiscordUtils.StickerInfo;

@Discord()
@Category("ResourceBanner", "Commands deal with banning attachments, embeds and emojis from messages")
@Category("ResourceBanner", [
    {
        name: "banAttachment",
        description: "This command is used to ban an attachment, to use it, reply to a message and use {prefix}banAttachment \n banning an attachment means that if it is posted again, it is automatically deleted and logged",
        type: "SIMPLECOMMAND",
        options: [],
        examples: ["banAttachment = while replying to a message you wish to ban"]
    },
    {
        name: "banEmoji",
        description: "This command is used to ban emojis from other servers, to use it, reply to a message that contains the emoji you want banned, if the replied message contains more than one emoji, this bot will ask you what one you wish to ban",
        type: "SIMPLECOMMAND",
        options: []
    },
    {
        name: "banSticker",
        description: "This command is used to ban stickers from other servers, to use it, reply to a message that contains the sticker you want banned",
        type: "SIMPLECOMMAND",
        options: []
    }
])
@Permission(new DefaultPermissionResolver(AbstractCommand.getDefaultPermissionAllow))
@Permission(AbstractCommand.getPermissions)
export abstract class ResourceBanner extends AbstractCommand {

    public static async doBanAttachment(attachment: Buffer, reason: string, url: string, guildId: string, isEmoji: boolean = false, isSticker: boolean = false): Promise<BannedAttachmentsModel> {
        const attachmentHash = md5(attachment);
        const repo = getRepository(BannedAttachmentsModel);
        const exists = await repo.count({
            where: {
                attachmentHash,
                guildId
            }
        }) === 1;
        if (exists) {
            return null;
        }
        const entry = BaseDAO.build(BannedAttachmentsModel, {
            attachmentHash,
            url,
            reason,
            guildId,
            isEmoji,
            isSticker
        });
        return repo.save(entry);
    }

    @SimpleCommand("banSticker")
    @Guard(NotBot, CommandEnabled())
    private async banSticker({message}: SimpleCommandMessage): Promise<void> {
        const {reference} = message;
        if (!reference) {
            message.reply("Please reply to a message");
            return;
        }
        const repliedMessageID = reference.messageId;
        const repliedMessageObj = await message.channel.messages.fetch(repliedMessageID);
        const {stickers} = repliedMessageObj;
        // you can have more than one sticker per message???? 
        if (stickers.size !== 1) {
            message.reply("Please reply to a message that contains only one sticker");
            return;
        }

        const argumentArray = StringUtils.splitCommandLine(message.content);
        if (argumentArray.length !== 1) {
            message.reply("Please supply a reason");
            return;
        }
        const reason: string = argumentArray[0];
        const findMessage = await message.reply("Please wait while i extract the sticker...");
        const sticker: Sticker = stickers.first();
        let stickerInfo: StickerInfo = null;
        try {
            stickerInfo = await DiscordUtils.getStickerInfo(sticker);
        } catch {
            await findMessage.delete();
            message.reply("Error finding Sticker");
            return;
        }
        await ResourceBanner.doBanAttachment(stickerInfo.buffer, reason, stickerInfo.url, message.guild.id, false, true);
        await findMessage.delete();
        await message.reply("Sticker added to ban database");
        repliedMessageObj.delete();
    }

    @SimpleCommand("banEmoji")
    @Guard(NotBot, CommandEnabled())
    private async banEmoji({message}: SimpleCommandMessage): Promise<void> {
        const repliedMessageLink = message.reference;
        if (!repliedMessageLink) {
            message.reply("Please reply to a message");
            return;
        }
        const argumentArray = StringUtils.splitCommandLine(message.content);
        if (argumentArray.length !== 1) {
            message.reply("Please supply a reason");
            return;
        }
        const reason: string = argumentArray[0];
        const repliedMessageID = repliedMessageLink.messageId;
        const repliedMessageObj = await message.channel.messages.fetch(repliedMessageID);
        const emojisFromMessage = DiscordUtils.getEmojiFromMessage(repliedMessageObj, false);
        if (emojisFromMessage.length === 0) {
            message.reply("Message contains no external emoji");
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
            for (const [key, value] of emojiMap) {
                reply += `${key}: ${value} \n`;
            }
            await message.reply(`What emoji would you like to ban: \n${reply}`);
            const filter = (response: Message): boolean => {
                if (!response.member || !message.member) {
                    return false;
                }
                return response.member.id === message.member.id && emojiMap.has(response.content.toUpperCase());
            };
            let collected: Collection<Snowflake, Message> = null;
            try {
                collected = await message.channel.awaitMessages({
                    filter, max: 1, time: 10000, errors: ['time']
                });
            } catch {
                message.reply("Timout exceeded.");
                return;
            }
            const result = collected.first().content.toUpperCase();
            const emojiRef = emojiMap.get(result);
            emojiId = emojiRef.split(":").pop().slice(0, -1);
        } else {
            emojiId = emojisFromMessage[0].split(":").pop().slice(0, -1);
        }

        const findMessage = await message.reply("Please wait while i extract the emoji...");
        let emojiInfo: EmojiInfo = null;
        try {
            emojiInfo = await DiscordUtils.getEmojiInfo(emojiId);
        } catch {
            await findMessage.delete();
            message.reply("Error finding emoji");
            return;
        }

        await ResourceBanner.doBanAttachment(emojiInfo.buffer, reason, emojiInfo.url, message.guild.id, true);
        await findMessage.delete();
        await message.reply("Emoji added to ban database");
        repliedMessageObj.delete();
    }

    @SimpleCommand("banAttachment")
    @Guard(NotBot, CommandEnabled())
    private async banAttachment({message}: SimpleCommandMessage): Promise<void> {
        const repliedMessageRef = message.reference;
        if (!repliedMessageRef) {
            message.reply("Please reply to a message that contains an attachment");
            return;
        }
        const argumentArray = StringUtils.splitCommandLine(message.content);
        if (argumentArray.length !== 1) {
            message.reply("Please supply a reason");
            return;
        }
        const reason: string = argumentArray[0];
        const repliedMessageID = repliedMessageRef.messageId;
        const repliedMessageObj = await message.channel.messages.fetch(repliedMessageID);
        let urlsInMessage: Set<string> = null;
        const repliedMessageContent = repliedMessageObj.content;
        if (ObjectUtil.validString(repliedMessageContent)) {
            urlsInMessage = ObjectUtil.getUrls(repliedMessageObj.content);
        }
        const attachmentArray = repliedMessageObj.attachments;
        if (attachmentArray.size === 0 && (urlsInMessage && urlsInMessage.size === 0)) {
            message.reply("Linked message contains no attachments");
            return;
        }
        const waitMessage = await message.channel.send("Extracting attachments...");
        const urls = attachmentArray.map(value => (value.attachment as string));
        if (urlsInMessage && urlsInMessage.size > 0) {
            urls.push(...urlsInMessage.values());
        }
        let successful = 0;
        for (const urlToAttachment of urls) {
            try {
                const attachment = await DiscordUtils.loadResourceFromURL(urlToAttachment);
                await ResourceBanner.doBanAttachment(attachment, reason, urlToAttachment, message.guild.id);
                successful++;
            } catch (e) {
                await message.reply(`Error extracting attachment"`);
                console.error(e);
            }
        }
        if (successful === 0) {
            message.reply("no attachments extracted, see above errors");
            return;
        }
        try {
            await waitMessage.delete();
            await repliedMessageObj.delete();
        } catch {
        }

        message.reply("attachments extracted, any more messages with these attachments will be auto deleted");
    }
}
