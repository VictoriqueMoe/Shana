import {ArgsOf, Client} from "discordx";
import {DiscordUtils, GuildUtils, ObjectUtil} from "../../utils/Utils";
import {BannedAttachmentsModel} from "../../model/DB/entities/guild/BannedAttachments.model";
import {DMChannel, GuildMember, Message, Role, Sticker, User} from "discord.js";
import {GuildManager} from "../../model/framework/manager/GuildManager";
import {MessageListenerDecorator} from "../../model/decorators/messageListenerDecorator";
import {notBot} from "../../guards/NotABot";
import {container, singleton} from "tsyringe";
import {getRepository} from "typeorm";
import axios from "axios";
import {Property} from "../../model/decorators/Property";
import {TimedSet} from "@discordx/utilities";
import EmojiInfo = DiscordUtils.EmojiInfo;
import StickerInfo = DiscordUtils.StickerInfo;

const md5 = require('md5');

@singleton()
export class MessageListener {

    /*@On("message")
    @Guard(NotBot, PremiumChannelOnlyCommand, BlockGuard)
    private activateVibrator([message]: ArgsOf<"messageCreate">, client: Client): void {
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

    private _autoReplyTimer = new TimedSet<string>(60000);

    @Property("cleverBotKey", false)
    private readonly cleverBotKey: string;

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
            const exists = await getRepository(BannedAttachmentsModel)
                .createQueryBuilder("bannedAttachment")
                .where(`bannedAttachment.guildId = :id`, {
                    id: message.guild.id
                })
                .andWhere(`bannedAttachment.isEmoji = true`)
                .andWhere(`bannedAttachment.attachmentHash = :hash OR bannedAttachment.url = :url`, {
                    hash: emojiHash,
                    url: bannedEmojiInfo.url
                })
                .getOne();
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

    private async doStickerBan(stickers: Sticker[], message: Message): Promise<void> {
        for (const sticker of stickers) {
            let bannedStickerInfo: StickerInfo = null;
            try {
                bannedStickerInfo = await DiscordUtils.getStickerInfo(sticker);
            } catch {

            }
            if (!bannedStickerInfo) {
                return;
            }
            const stickerHash = md5(bannedStickerInfo.buffer);
            const count = await getRepository(BannedAttachmentsModel)
                .createQueryBuilder("bannedAttachment")
                .where(`bannedAttachment.guildId = :id`, {
                    id: message.guild.id
                })
                .andWhere(`bannedAttachment.isSticker = true`)
                .andWhere(`bannedAttachment.attachmentHash = :hash OR bannedAttachment.url = :url`, {
                    hash: stickerHash,
                    url: bannedStickerInfo.url
                })
                .getCount();
            if (count === 1) {
                try {
                    await message.delete();
                    message.channel.send(`Message contains a banned Sticker`);
                } catch {
                }
                break;
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
    private async logDMs([message]: ArgsOf<"messageCreate">, client: Client): Promise<void> {
        if (message.author.bot || !ObjectUtil.validString(message.content)) {
            return;
        }
        if (message.channel instanceof DMChannel) {
            const user = message.author;
            const {id} = user;
            try {
                const guildManager = container.resolve(GuildManager);
                const guilds = await guildManager.getGuilds();
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

    @MessageListenerDecorator(false, notBot)
    private async replier([message]: ArgsOf<"messageCreate">, client: Client): Promise<void> {
        if (!ObjectUtil.validString(this.cleverBotKey) || !message.member) {
            return;
        }
        const me = message.guild.me.id;
        const userId = message.member.id;
        let shouldReply = message.mentions.has(me);
        if (!shouldReply) {
            shouldReply = true;
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
            if (!repliedMessageObj.member || repliedMessageObj.member.id !== me) {
                return;
            }
        }
        const inTimer = this._autoReplyTimer.rawSet.find(id => id === userId) ?? null;
        if (ObjectUtil.validString(inTimer)) {
            this._autoReplyTimer.refresh(userId);
        }
        if (!shouldReply || ObjectUtil.validString(inTimer)) {
            return;
        }
        this._autoReplyTimer.add(userId);
        let messageContent = message.content;
        messageContent = DiscordUtils.sanitiseTextForApiConsumption(messageContent);
        if (!ObjectUtil.validString(messageContent)) {
            return;
        }
        const request = {
            "key": this.cleverBotKey,
            "input": messageContent
        };
        const url = Object.keys(request).map(key => `${key}=${encodeURIComponent(request[key])}`).join('&');
        let reply = null;
        try {
            const replyPayload = await axios.get(`https://www.cleverbot.com/getreply?${url}`);
            reply = replyPayload.data;
        } catch (e) {
            return;
        }
        message.reply(reply.output);
    }

    @MessageListenerDecorator(true)
    private async scanSticker([message]: ArgsOf<"messageCreate">, client: Client): Promise<void> {
        const member = message.member;
        if (!member) {
            return;
        }
        if (GuildUtils.isMemberAdmin(message.member)) {
            return;
        }
        const stickers = message.stickers;
        this.doStickerBan([...stickers.values()], message);
    }

    @MessageListenerDecorator(true)
    private async scanEmoji([message]: ArgsOf<"messageCreate">, client: Client): Promise<void> {
        const member = message.member;
        if (!member) {
            return;
        }
        const emojis = DiscordUtils.getEmojiFromMessage(message, false);
        const emojiIds = emojis.map(emoji => emoji.split(":").pop().slice(0, -1));
        MessageListener.doEmojiBan(emojiIds, message.member.user, message, false);
    }

}
