import {ArgsOf, Client, Guard, On} from "@typeit/discord";
import {NotBot} from "../guards/NotABot";
import fetch from "node-fetch";
import {PremiumChannelOnlyCommand} from "../guards/PremiumChannelOnlyCommand";
import {BlockGuard} from "../guards/BlockGuard";
import {Roles} from "../enums/Roles";
import {DiscordUtils, ObjectUtil} from "../utils/Utils";
import {BannedAttachmentsModel} from "../model/DB/BannedAttachments.model";
import {Main} from "../Main";
import RolesEnum = Roles.RolesEnum;

const getUrls = require('get-urls');

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
    @Guard(NotBot)
    private async iLoveCocks([message]: ArgsOf<"message">, client: Client): Promise<void> {
        const atttchments = message.attachments;
        const imgHash = "40d2949f7479d0f2ada3b178c1e1bcbd";
        for (const [, atttchmentObj] of atttchments) {
            const attachment = await DiscordUtils.loadResourceFromURL((atttchmentObj.attachment as string));
            const attachmentHash = md5(attachment);
            if (attachmentHash === imgHash) {
                message.channel.send("<@697417252320051291> does");
                return;
            }
        }
    }

    @On("message")
    private async scanAttachments([message]: ArgsOf<"message">, client: Client): Promise<void> {
        if (Roles.isMemberStaff(message.member) && !Main.testMode) {
            return;
        }
        const attachments = message.attachments;
        const messageContent = message.content;
        const arratchmentUrl: string[] = attachments.map(attachmentObject => attachmentObject.attachment as string);

        if (ObjectUtil.validString(messageContent)) {
            const urlsInMessage = getUrls(messageContent);
            if (urlsInMessage.size > 0) {
                arratchmentUrl.push(...urlsInMessage.values());
            }
        }
        let shouldDelete = false;
        let reason: string = null;
        for (const url of arratchmentUrl) {
            const attachment = await DiscordUtils.loadResourceFromURL(url);
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