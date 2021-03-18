import {ArgsOf, Client, Command, CommandMessage, Description, Guard, On} from "@typeit/discord";
import {NotBot} from "../../guards/NotABot";
import {roleConstraints} from "../../guards/RoleConstraint";
import {BlockGuard} from "../../guards/BlockGuard";
import {Roles} from "../../enums/Roles";
import {ArrayUtils, DiscordUtils, Ffmpeg, GuildUtils, ObjectUtil, StringUtils} from "../../utils/Utils";
import {BaseDAO} from "../../DAO/BaseDAO";
import {BannedAttachmentsModel} from "../../model/DB/BannedAttachments.model";
import {DirResult} from "tmp";
import {Main} from "../../Main";
import {Collection, MessageEmbed} from "discord.js";
import * as fs from 'fs';

const isVideo = require('is-video');
const tmp = require('tmp');
const getUrls = require('get-urls');
const md5 = require('md5');
import ffmpeg = require("ffmpeg");
import RolesEnum = Roles.RolesEnum;

const {basename, join} = require('path');
const sanitize = require('sanitize-filename');

export abstract class AttachmentBanner extends BaseDAO<BannedAttachmentsModel> {

    private static readonly MAX_SIZE_BYTES: number = 10485760;
    private static readonly MAX_SIZE_KB = AttachmentBanner.MAX_SIZE_BYTES / 1024;

    @On("message")
    @Guard(NotBot)
    private async discordMessageCrash([message]: ArgsOf<"message">, client: Client): Promise<void> {
        if (Main.testMode && message.member.id !== "697417252320051291") {
            return;
        }
        const messageContent = message.content;
        let urlsInMessage: Set<string> = new Set();
        if (ObjectUtil.validString(messageContent)) {
            urlsInMessage = getUrls(messageContent);
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
                        attachmentHash
                    }
                }) === 1;
                if (exists && !Main.testMode) {
                    continue;
                }
                const size = Buffer.byteLength(attachment);
                if (size > AttachmentBanner.MAX_SIZE_BYTES) {
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
                    errors = await Ffmpeg.checkVideo(fileName, AttachmentBanner.MAX_SIZE_BYTES);
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
                    await this.doBanAttachment(attachment, "Discord crash video", urlToAttachment);
                    await message.delete({
                        reason: "Discord crash video"
                    });
                    didBan = true;
                }
            }
        } finally {
            this._cleanup(vidTemp);
        }
        if (didBan || Main.testMode) {
            let messageToRespond = `This item contains suspicious code, and has been deleted, if you think this an error, please ping <@697417252320051291>`;
            try {
                const vicMemeber = await message.guild.members.fetch("697417252320051291");
                if (vicMemeber) {
                    messageToRespond += ` (${vicMemeber} (${vicMemeber.user.tag}))`;
                }
            } catch {
            }
            message.reply(messageToRespond);
            const messageMember = message.member;
            const descriptionPostfix = `that contains suspicious code in <#${message.channel.id}>, this could be a discord crash video. the first 10 errors are as shown below: `;
            const embed = new MessageEmbed()
                .setColor('#337FD5')
                .setAuthor(message.member, GuildUtils.getGuildIconUrl())
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

            DiscordUtils.postToLog(embed);
        }
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

    @Command("banAttachment")
    @Description(AttachmentBanner.viewDescriptionForSetUsernames())
    @Guard(NotBot, roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE), BlockGuard)
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
                await this.doBanAttachment(attachment, reason, urlToAttachment);
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

    public async doBanAttachment(attachment: Buffer, reason: string, url: string): Promise<BannedAttachmentsModel> {
        const attachmentHash = md5(attachment);
        const exists = await BannedAttachmentsModel.count({
            where: {
                attachmentHash
            }
        }) === 1;
        if (exists) {
            return null;
        }
        const entry = new BannedAttachmentsModel({
            attachmentHash,
            url,
            reason
        });
        return super.commitToDatabase(entry);
    }

    private static viewDescriptionForSetUsernames() {
        return "Ban the attachment that is contained in the linked messages \n usage: ~banAttachment <reason>";
    }
}