import {ArgsOf, Client, Guard, On} from "@typeit/discord";
import {NotBot} from "../guards/NotABot";
import fetch from "node-fetch";
import {PremiumChannelOnlyCommand} from "../guards/PremiumChannelOnlyCommand";
import {BlockGuard} from "../guards/BlockGuard";
import {Roles} from "../enums/Roles";
import {DiscordUtils} from "../utils/Utils";
import {BannedAttachmentsModel} from "../model/DB/BannedAttachments.model";
import RolesEnum = Roles.RolesEnum;

const md5 = require('md5');

const {loveSenseToken, uid, toyId} = require('../../config.json');

export abstract class MessageListener {

    @On("message")
    @Guard(NotBot, PremiumChannelOnlyCommand, BlockGuard)
    private activateVibrator([message]: ArgsOf<"message">, client: Client): void {
        const hasPingedRole = message.mentions.roles.has(RolesEnum.WEEB_OVERLORD); // whore role
        if (hasPingedRole) {
            console.log(`user: ${message.author.username} pinged your role`);
            const command = "AVibrate";
            const v = 20;
            const sec = 1;
            fetch(`https://api.lovense.com/api/lan/command?token=${loveSenseToken}&uid=${uid}&command=${command}&v=${v}&t=${toyId}&sec=${sec}`, {
                method: 'post'
            });
        }
    }

    @On("message")
    private async scanAttachments([message]: ArgsOf<"message">, client: Client): Promise<void> {
        if (Roles.isMemberStaff(message.member)) {
            return;
        }
        const attachments = message.attachments;
        let shouldDelete = false;
        let reason: string = null;
        for (const [, attachmentObject] of attachments) {
            const urlToImage = attachmentObject.attachment as string;
            const attachment = await DiscordUtils.loadResourceFromURL(urlToImage);
            const attachmentHash = md5(attachment);
            const exists = await BannedAttachmentsModel.findOne({
                where: {
                    attachmentHash
                }
            });
            if (exists) {
                shouldDelete = true;
                reason = exists.reason;
                break;
            }
        }
        if (shouldDelete) {
            await message.delete();
            message.reply("Message contains a banned attachment");
            DiscordUtils.postToLog(`Member: <@${message.member.id}> posted a banned attachment that was banned for reason: "${reason}"`);
        }
    }
}