import {ArgsOf, Client, Command, CommandMessage, Description, Guard, On} from "@typeit/discord";
import {NotBot} from "../../guards/NotABot";
import {secureCommand} from "../../guards/RoleConstraint";
import {ArrayUtils, DiscordUtils, Ffmpeg, GuildUtils, ObjectUtil, StringUtils} from "../../utils/Utils";
import {BannedAttachmentsModel} from "../../model/DB/BannedAttachments.model";
import {DirResult} from "tmp";
import {Main} from "../../Main";
import {Collection, Message, MessageEmbed, Snowflake} from "discord.js";
import * as fs from 'fs';
import {AbstractCommand} from "../AbstractCommand";

const isVideo = require('is-video');
const tmp = require('tmp');
const getUrls = require('get-urls');
const md5 = require('md5');
import ffmpeg = require("ffmpeg");
import EmojiInfo = DiscordUtils.EmojiInfo;

const {basename, join} = require('path');
const sanitize = require('sanitize-filename');

export abstract class ResourceBanner extends AbstractCommand<BannedAttachmentsModel> {

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

    private static readonly MAX_SIZE_BYTES: number = 10485760;

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

        await this.doBanAttachment(emojiInfo.buffer, reason, emojiInfo.url, command.guild.id, true);
        await findMessage.delete();
        await command.reply("Emoji added to ban database");
        repliedMessageObj.delete();
    }

    public async doBanAttachment(attachment: Buffer, reason: string, url: string, guildId: string, isEmoji = false): Promise<BannedAttachmentsModel> {
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

        return super.commitToDatabase(entry);
    }

    private _analyseError(errors: string[]): string[] {
        const retArray: string[] = [];
        for (const error of errors) {
            const innerErrorArray = error.split(/\r?\n/);
            for (const innerIfno of innerErrorArray) {
                if (innerIfno.includes("Frame parameters mismatch context")) {
                    retArray.push(innerIfno);
                }
            }
        }
        return retArray;
    }

    private _cleanup(...paths: DirResult[]) {
        for (const lPath of paths) {
            if (lPath) {
                try {
                    lPath.removeCallback();
                } catch {
                    fs.rmdirSync(lPath.name, {recursive: true});
                }
            }
        }
    }

    @On("message")
    @Guard(NotBot)
    private async discordMessageCrash([message]: ArgsOf<"message">, client: Client): Promise<void> {
        if (Main.testMode && message.member.id !== "697417252320051291") {
            return;
        }
        try {
            message = await message.fetch(true);
        } catch {

        }
        const messageContent = message.content;
        let urlsInMessage: Set<string> = new Set();
        if (ObjectUtil.validString(messageContent)) {
            urlsInMessage = getUrls(messageContent);
        }
        const embeds = message.embeds;
        if (ArrayUtils.isValidArray(embeds)) {
            for (const embed of embeds) {
                if (embed.video) {
                    urlsInMessage.add(embed.video.url);
                }
            }
        }
        const attatchmentArray = message.attachments || new Collection();
        if (attatchmentArray.size === 0 && urlsInMessage.size === 0) {
            return;
        }
        const urls = attatchmentArray.map(value => (value.attachment as string));
        if (urlsInMessage && urlsInMessage.size > 0) {
            urls.push(...urlsInMessage.values());
        }
        const vidTemp = tmp.dirSync({
            unsafeCleanup: true
        });
        let didBan = false;
        let errors: string[] = [];
        try {
            for (const urlToAttachment of urls) {
                if (!isVideo(urlToAttachment)) {
                    continue;
                }

                let fail = false;
                let attachment: Buffer;
                try {
                    attachment = await DiscordUtils.loadResourceFromURL(urlToAttachment);
                } catch {
                    continue;
                }
                const attachmentHash = md5(attachment);
                const exists = await BannedAttachmentsModel.count({
                    where: {
                        attachmentHash,
                        guildId: message.guild.id
                    }
                }) === 1;
                if (exists && !Main.testMode) {
                    continue;
                }
                const size = Buffer.byteLength(attachment);
                if (size > ResourceBanner.MAX_SIZE_BYTES) {
                    continue;
                }
                const fileName = join(vidTemp.name, sanitize(basename(urlToAttachment)));
                try {
                    fs.writeFileSync(fileName, attachment);
                } catch {
                    continue;
                }
                let video;
                try {
                    video = await new ffmpeg(fileName);
                } catch {
                    continue;
                }
                if (ObjectUtil.validString(video.metadata.video.container)) {
                    const container: string = video.metadata.video.container;
                    if (container.includes("image")
                        || container.includes("gif")) {
                        continue;
                    }
                }

                const encoding: string = video.metadata.video.codec;
                if (ObjectUtil.validString(encoding)) {
                    if (encoding !== "AVC" && encoding !== "h264") {
                        continue;
                    }
                }
                try {
                    errors = await Ffmpeg.checkVideo(fileName, ResourceBanner.MAX_SIZE_BYTES);
                    if (ArrayUtils.isValidArray(errors)) {
                        const videoErrorExpanded = this._analyseError(errors);
                        if (ArrayUtils.isValidArray(videoErrorExpanded)) {
                            errors = videoErrorExpanded;
                            console.error(`possible not an error ${fileName} \n${errors}`);
                            fail = true;
                        }
                    }
                } catch (e) {
                    console.error(`possible not an error ${fileName} \n ${e}`);
                    fail = true;
                }
                if (fail && !Main.testMode) {
                    await this.doBanAttachment(attachment, "Discord crash video", urlToAttachment, message.guild.id);
                    try {
                        await message.delete({
                            reason: "Discord crash video"
                        });
                    } catch (e) {
                        console.error(e);
                    }
                    didBan = true;
                }
            }
        } finally {
            this._cleanup(vidTemp);
        }
        if (didBan || Main.testMode) {
            const messageToRespond = `This item is a Discord crash video and has been deleted`;
            message.reply(messageToRespond);
            const messageMember = message.member;
            const descriptionPostfix = `that contains suspicious code in <#${message.channel.id}>, this is a discord crash video. the first 10 errors are as shown below: `;
            const embed = new MessageEmbed()
                .setColor('#337FD5')
                .setAuthor(messageMember, GuildUtils.getGuildIconUrl(message.guild.id))
                .setDescription(`someone posted a video ${descriptionPostfix}`)
                .setTimestamp();
            if (messageMember) {
                const avatarUrl = messageMember.user.displayAvatarURL({format: 'jpg'});
                embed.setAuthor(messageMember.user.tag, avatarUrl);
                embed.setDescription(`<@${messageMember.id}> posted a video ${descriptionPostfix}`);
            }
            errors.slice(0, 10).forEach((value, index) => {
                embed.addField(`hex dump #${index + 1}`, value);
            });
            DiscordUtils.postToLog(embed, message.guild.id);
            GuildUtils.sendToJail(messageMember, "you have bee placed here because you posted a discord crash video");
        }
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
                await this.doBanAttachment(attachment, reason, urlToAttachment, command.guild.id);
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