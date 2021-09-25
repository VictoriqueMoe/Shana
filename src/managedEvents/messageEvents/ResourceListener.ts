import {ArgsOf, Client} from "discordx";
import {ArrayUtils, DiscordUtils, Ffmpeg, GuildUtils, ObjectUtil} from "../../utils/Utils";
import {Collection, MessageEmbed} from "discord.js";
import {BannedAttachmentsModel} from "../../model/DB/BannedAttachments.model";
import fs from "fs";
import {MessageListenerDecorator} from "../../model/decorators/messageListenerDecorator";
import {ResourceBanner} from "../../commands/customAutoMod/ResourceBanner";
import {Main} from "../../Main";
import {DirResult} from "tmp";
import {notBot} from "../../guards/NotABot";
import ffmpeg = require("ffmpeg");

const getUrls = require('get-urls');
const isVideo = require('is-video');
const tmp = require('tmp');

const {basename, join} = require('path');
const sanitize = require('sanitize-filename');
const md5 = require('md5');

export class ResourceListener {
    private static readonly MAX_SIZE_BYTES: number = 10485760;

    @MessageListenerDecorator(true, notBot)
    private async discordMessageCrash([message]: ArgsOf<"message">, client: Client): Promise<void> {
        if (Main.testMode && message.member.id !== "697417252320051291") {
            return;
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
                if (size > ResourceListener.MAX_SIZE_BYTES) {
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
                    errors = await Ffmpeg.checkVideo(fileName, ResourceListener.MAX_SIZE_BYTES);
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
                    await ResourceBanner.doBanAttachment(attachment, "Discord crash video", urlToAttachment, message.guild.id);
                    try {
                        await message.delete();
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
                .setAuthor(messageMember.user.tag, GuildUtils.getGuildIconUrl(message.guild.id))
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
            DiscordUtils.postToLog([embed], message.guild.id);
            GuildUtils.sendToJail(messageMember, "you have been placed here because you posted a discord crash video");
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

    private _cleanup(...paths: DirResult[]): void {
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
}