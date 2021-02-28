import {Command, CommandMessage, Description, Guard} from "@typeit/discord";
import {NotBot} from "../../guards/NotABot";
import {roleConstraints} from "../../guards/RoleConstraint";
import {BlockGuard} from "../../guards/BlockGuard";
import {Roles} from "../../enums/Roles";
import {DiscordUtils, ObjectUtil, StringUtils} from "../../utils/Utils";
import {BaseDAO} from "../../DAO/BaseDAO";
import {BannedAttachmentsModel} from "../../model/DB/BannedAttachments.model";
const getUrls = require('get-urls');

const md5 = require('md5');
import RolesEnum = Roles.RolesEnum;

export abstract class AttachmentBanner extends BaseDAO<BannedAttachmentsModel> {

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
        if (urlsInMessage.size > 0) {
            urls.push(...urlsInMessage.values());
        }
        let successful = 0;
        for (const urlToAttachment of urls) {
            try {
                await this.doBanAttachment(urlToAttachment, reason);
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

    private async doBanAttachment(url: string, reason: string): Promise<boolean> {
        const attachment = await DiscordUtils.loadResourceFromURL(url);
        const attachmentHash = md5(attachment);
        const exists = await BannedAttachmentsModel.count({
            where: {
                attachmentHash
            }
        }) === 1;
        if (exists) {
            return true;
        }
        const entry = new BannedAttachmentsModel({
            attachmentHash,
            reason
        });
        await super.commitToDatabase(entry);
        return true;
    }

    private static viewDescriptionForSetUsernames() {
        return "Ban the attachment that is contained in the linked messages \n usage: ~banAttachment <reason>";
    }
}