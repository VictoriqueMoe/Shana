import {Command, CommandMessage, Description, Guard} from "@typeit/discord";
import {NotBot} from "../../guards/NotABot";
import {roleConstraints} from "../../guards/RoleConstraint";
import {BlockGuard} from "../../guards/BlockGuard";
import {Roles} from "../../enums/Roles";
import {DiscordUtils, StringUtils} from "../../utils/Utils";
import {BaseDAO} from "../../DAO/BaseDAO";
import {BannedAttachmentsModel} from "../../model/DB/BannedAttachments.model";

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
        const attatchmentArray = repliedMessageObj.attachments;
        if (attatchmentArray.size === 0) {
            command.reply("Linked message contains no attachments");
            return;
        }
        const waitMessage = await command.channel.send("Extracting attachments...");
        let successful = 0;
        for (const [, attachmentObject] of attatchmentArray) {
            const urlToImage = attachmentObject.attachment as string;
            const attachment = await DiscordUtils.loadResourceFromURL(urlToImage);
            const attachmentHash = md5(attachment);
            try {
                const exists = await BannedAttachmentsModel.count({
                    where: {
                        attachmentHash
                    }
                }) === 1;
                if (exists) {
                    successful++;
                    continue;
                }
                const entry = new BannedAttachmentsModel({
                    attachmentHash,
                    reason
                });
                await super.commitToDatabase(entry);
            } catch (e) {
                await command.reply(`Error extracting attachment: "${attachmentObject.name}"`);
                console.error(e);
                continue;
            }
            successful++;
        }
        if (successful === 0) {
            command.reply("no attachments extracted, see above errors");
            return;
        }
        await waitMessage.delete();
        await repliedMessageObj.delete();
        command.reply("attachments extracted, any more messages with these attachments will be auto deleted");
    }

    private static viewDescriptionForSetUsernames() {
        return "Ban the attachment that is contained in the linked messages \n usage: ~banAttachment <repliedMessage>";
    }
}