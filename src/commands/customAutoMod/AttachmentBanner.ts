import {ArgsOf, Client, Command, CommandMessage, Description, Guard, On} from "@typeit/discord";
import {NotBot} from "../../guards/NotABot";
import {roleConstraints} from "../../guards/RoleConstraint";
import {BlockGuard} from "../../guards/BlockGuard";
import {Roles} from "../../enums/Roles";
import {DiscordUtils, ObjectUtil, StringUtils} from "../../utils/Utils";
import {BaseDAO} from "../../DAO/BaseDAO";
import {BannedAttachmentsModel} from "../../model/DB/BannedAttachments.model";
import {DirResult} from "tmp";

const isVideo = require('is-video');
const fs = require('fs');
const tmp = require('tmp');

const {promisify} = require('util');
const sizeOf = promisify(require('image-size'));
const getUrls = require('get-urls');
const md5 = require('md5');
import ffmpeg = require("ffmpeg");
import RolesEnum = Roles.RolesEnum;

const {basename, join} = require('path');
const sanitize = require('sanitize-filename');

export abstract class AttachmentBanner extends BaseDAO<BannedAttachmentsModel> {

    @On("message")
    @Guard(NotBot)
    private async discordMessageCrash([message]: ArgsOf<"message">, client: Client): Promise<void> {
        const messageContent = message.content;
        let urlsInMessage: Set<string> = null;
        if (ObjectUtil.validString(messageContent)) {
            urlsInMessage = getUrls(messageContent);
        }
        const attatchmentArray = message.attachments;
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
        const tmpobj = tmp.dirSync({
            unsafeCleanup: true
        });
        let didBan = false;
        try {
            for (const urlToAttachment of urls) {
                if(!isVideo(urlToAttachment)){
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
                if (exists) {
                    continue;
                }
                const size = Buffer.byteLength(attachment);
                if (size > 10485760) {
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
                if (!ObjectUtil.validString(video.metadata.video.container)) {
                    continue;
                }
                if (ObjectUtil.validString(video.metadata.video.container)) {
                    const container: string = video.metadata.video.container;
                    if (container.includes("image")
                        || container.includes("gif")) {
                        return;
                    }
                }
                const {w, h} = video.metadata.video.resolution;
                const path = tmpobj.name;
                try {
                    // possible replace with https://www.npmjs.com/package/check-video
                    const frames = await video.fnExtractFrameToJPG(path, {
                        every_n_frames: 1
                    });
                    for (const image of frames) {
                        const dimensions = await sizeOf(image);
                        if (dimensions.width !== w || dimensions.height !== h) {
                            fail = true;
                            break;
                        }
                    }
                } catch (e) {
                    console.error("possible not an error \n" + e);
                    fail = true;
                }
                if (fail) {
                    await this.doBanAttachment(attachment, "Discord crash video", urlToAttachment);
                    await message.delete({
                        reason: "Discord crash video"
                    });
                    didBan = true;
                }
            }
        } finally {
            this._cleanup(vidTemp, tmpobj);
        }
        if (didBan) {
            message.reply(`This item contains suspicious code, and has been deleted, if you think this an error, please ping <@697417252320051291>`);
        }
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
        await waitMessage.delete();
        await repliedMessageObj.delete();
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