import {ArgsOf, Client} from "discordx";
import fetch from "node-fetch";
import {ArrayUtils, DiscordUtils, GuildUtils, ObjectUtil} from "../../utils/Utils";
import {BannedAttachmentsModel} from "../../model/DB/BannedAttachments.model";
import {Main} from "../../Main";
import {DMChannel, GuildMember, Message, Role, User} from "discord.js";
import {Op} from "sequelize";
import {GuildManager} from "../../model/guild/manager/GuildManager";
import {MessageListenerDecorator} from "../../model/decorators/messageListenerDecorator";
import {notBot} from "../../guards/NotABot";
import EmojiInfo = DiscordUtils.EmojiInfo;

const getUrls = require('get-urls');

const md5 = require('md5');


export abstract class MessageListener {

    /*@On("message")
    @Guard(NotBot, PremiumChannelOnlyCommand, BlockGuard)
    private activateVibrator([message]: ArgsOf<"message">, client: Client): void {
        const hasPingedRole = message.mentions.roles.has(RolesEnum.WEEB_OVERLORD); // whore role
        if (hasPingedRole) {
            console.log(`user: ${message.author.username} pinged your role`);
            const command = "AVibrate";
            const v = 20;
            const sec = 1;
            fetch(`https://api.lovense.com/api/lan/command?token=${process.env.loveSenseToken}&uid=${process.env.uid}&command=${command}&v=${v}&t=${process.env.toyId}&sec=${sec}`, {
                method: 'post'
            });
        }
    }*/

    public static async doEmojiBan(emojiIds: string[], user: User, message: Message, isReaction: boolean): Promise<void> {
        for (const emoji of emojiIds) {
            let bannedEmojiInfo: EmojiInfo = null;
            try {
                bannedEmojiInfo = await DiscordUtils.getEmojiInfo(emoji);
            } catch {

            }
            if (!bannedEmojiInfo) {
                return;
            }
            const emojiHash = md5(bannedEmojiInfo.buffer);
            const exists = await BannedAttachmentsModel.findOne({
                where: {
                    guildId: message.guild.id,
                    isEmoji: true,
                    [Op.or]: [
                        {
                            attachmentHash: emojiHash
                        }, {
                            url: bannedEmojiInfo.url
                        }
                    ]
                }
            });
            if (exists) {
                const reasonToDel = exists.reason;
                try {
                    if (isReaction) {
                        await message.reactions.cache.find(r => r.emoji.id == bannedEmojiInfo.id).users.remove(user);
                    } else {
                        await message.delete();
                        message.channel.send(`Message contains a banned emoji`);
                        DiscordUtils.postToLog(`Member: <@${message.member.id}> posted a message that contained a banned emoji with reason: "${reasonToDel}"`, message.guild.id);
                    }
                } catch {
                }
                break;
            }
        }
    }

    @MessageListenerDecorator(true, notBot)
    private async moeLoliDestroyer([message]: ArgsOf<"message">, client: Client): Promise<void> {
        if (!message.member) {
            return;
        }
        if (message.member.id === "270632394137010177") {
            const banned = ["ì", "|", "lol", "loli", "l0l"];
            let messageContent = message.content.replace(/\s/g, '').toLocaleLowerCase();
            messageContent = messageContent.replace(/[ ,.-]/g, "");
            let shouldBlock = false;
            for (const ban of banned) {
                if (messageContent.includes(ban.toLocaleLowerCase())) {
                    shouldBlock = true;
                    break;
                }
            }
            if (shouldBlock) {
                this.doPoser(message);
                return;
            }
        }
    }

    private doPoser(message: Message): void {
        message.reply("Poser").then(value => {
            setTimeout(() => {
                value.delete();
            }, 3000);
        });
        message.delete();
    }

    @MessageListenerDecorator()
    private async logDMs([message]: ArgsOf<"message">, client: Client): Promise<void> {
        if (message.author.bot || !ObjectUtil.validString(message.content)) {
            return;
        }
        if (message.channel instanceof DMChannel) {
            const user = message.author;
            const {id} = user;
            try {
                const guilds = await GuildManager.instance.getGuilds();
                for (const guild of guilds) {
                    let member: GuildMember = null;
                    let youngAccountRole: Role = null;
                    try {
                        member = await guild.members.fetch(id);
                        youngAccountRole = await GuildUtils.RoleUtils.getYoungAccountRole(guild.id);
                    } catch {
                        continue;
                    }
                    if (!youngAccountRole || !member || !member.roles.cache.has(youngAccountRole.id)) {
                        continue;
                    }
                    const messageToPost = `<@${member.id}> send a message in DM: "${message.content}"`;
                    await DiscordUtils.postToLog(messageToPost, guild.id);
                    break;
                }
            } catch {
            }
            console.log(`<@${user.id}> send a message in DM: "${message.content}"`);
            return;
        }
    }

    // @MessageListenerDecorator(false, notBot)
    private async replier([message]: ArgsOf<"message">, client: Client): Promise<void> {
        if (!message.member) {
            return;
        }
        if (message.channel.id === "815042892120457216" || message.member.id === "323890636166135808") {
            return;
        }
        const repliedMessage = message.reference;
        if (!repliedMessage) {
            return;
        }
        const repliedMessageId = repliedMessage.messageId;
        let repliedMessageObj: Message;
        try {
            repliedMessageObj = await message.channel.messages.fetch(repliedMessageId);
        } catch {
            return;
        }
        if (!repliedMessageObj.member || repliedMessageObj.member.id !== GuildUtils.vicBotId) {
            return;
        }
        const messageContent = message.content;
        if (!ObjectUtil.validString(messageContent)) {
            return;
        }
        const request = {
            "key": process.env.cleverBotKey,
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

    @MessageListenerDecorator(true)
    private async scanEmoji([message]: ArgsOf<"message">, client: Client): Promise<void> {
        const member = message.member;
        if (!member) {
            return;
        }
        if (GuildUtils.isMemberAdmin(message.member) && Main.testMode === false) {
            return;
        }
        const emojis = DiscordUtils.getEmojiFromMessage(message, false);
        const emojiIds = emojis.map(emoji => emoji.split(":").pop().slice(0, -1));
        MessageListener.doEmojiBan(emojiIds, message.member.user, message, false);
    }


    @MessageListenerDecorator(true)
    private async scanAttachments([message]: ArgsOf<"message">, client: Client): Promise<void> {
        const member = message.member;
        if (!member) {
            return;
        }
        try {
            message = await message.fetch();
        } catch {

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
        const embeds = message.embeds;
        if (ArrayUtils.isValidArray(embeds)) {
            for (const embed of embeds) {
                if (embed.video) {
                    arratchmentUrl.push(embed.video.url);
                }
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
                    guildId: message.guild.id,
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
            try {
                const member = message.member;
                await message.delete();
                message.reply("Message contains a banned attachment");
                DiscordUtils.postToLog(`Member: <@${member.id}> posted a banned attachment "${reason}"`, message.guild.id);
                if (member) {
                    await GuildUtils.sendToJail(member, `you have been placed here because you sent an attachment that was banned for the reason: "${reason}"`);
                }
            } catch {
            }
        }
    }
}