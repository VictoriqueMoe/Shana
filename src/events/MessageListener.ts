import {ArgsOf, Client, Guard, On} from "@typeit/discord";
import {NotBot} from "../guards/NotABot";
import fetch from "node-fetch";
import {PremiumChannelOnlyCommand} from "../guards/PremiumChannelOnlyCommand";
import {BlockGuard} from "../guards/BlockGuard";
import {Roles} from "../enums/Roles";
import {DiscordUtils, GuildUtils, ObjectUtil} from "../utils/Utils";
import {BannedAttachmentsModel} from "../model/DB/BannedAttachments.model";
import {Main} from "../Main";
import {Message} from "discord.js";
import {Op} from "sequelize";
import RolesEnum = Roles.RolesEnum;

const {cleverBotKey} = require('../../config.json');
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
    private async replier([message]: ArgsOf<"message">, client: Client): Promise<void> {
        if (message.channel.id === "815042892120457216") {
            return;
        }
        const repliedMessage = message.reference;
        if (!repliedMessage) {
            return;
        }
        const repliedMessageId = repliedMessage.messageID;
        let repliedMessageObj: Message;
        try {
            repliedMessageObj = await message.channel.messages.fetch(repliedMessageId);
        } catch {
            return;
        }
        if (repliedMessageObj.member.id !== GuildUtils.vicBotId) {
            return;
        }
        const messageContent = message.content;
        if (!ObjectUtil.validString(messageContent)) {
            return;
        }
        const request = {
            "key": cleverBotKey,
            "input": messageContent
        };
        const url = Object.keys(request).map(key => `${key}=${encodeURIComponent(request[key])}`).join('&');
        let reply = null;
        try {
            const replyPayload = await fetch(`https://www.cleverbot.com/getreply?${url}`, {
                method: 'get'
            });
            reply = await replyPayload.json();
        } catch (e) {
            return;
        }
        message.channel.send(reply.output);
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
        const member = message.member;
        if (!member) {
            return;
        }
        if (Roles.isMemberStaff(member) && !Main.testMode) {
            return;
        }
        const attachments = message.attachments;
        const messageContent = message.content;
        const arratchmentUrl: string[] = attachments.map(attachmentObject => attachmentObject.attachment as string);

        if (ObjectUtil.validString(messageContent)) {
            const urlsInMessage = getUrls(messageContent);
            if (urlsInMessage && urlsInMessage.size > 0) {
                arratchmentUrl.push(...urlsInMessage.values());
            }
        }
        let shouldDelete = false;
        let reason: string = null;
        for (const url of arratchmentUrl) {
            let attachment;
            try {
                attachment = await DiscordUtils.loadResourceFromURL(url);
            } catch {
                continue;
            }
            const attachmentHash = md5(attachment);
            const exists = await BannedAttachmentsModel.findOne({
                where: {
                    [Op.or]: [
                        {
                            attachmentHash
                        }, {
                            url
                        }
                    ]
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