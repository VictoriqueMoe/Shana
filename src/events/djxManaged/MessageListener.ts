import {singleton} from "tsyringe";
import {Message} from "discord.js";
import {TimedSet} from "@discordx/utilities";
import {DiscordUtils, ObjectUtil} from "../../utils/Utils.js";
import {MessageListenerDecorator} from "../../model/framework/decorators/MessageListenerDecorator.js";
import {notBot} from "../../guards/managedGuards/NotABot.js";
import {ArgsOf} from "discordx";
import axios from "axios";
import {Property} from "../../model/framework/decorators/Property.js";
import {RoleManager} from "../../model/framework/manager/RoleManager.js";
import {LogChannelManager} from "../../model/framework/manager/LogChannelManager.js";

@singleton()
export class MessageListener {

    private _autoReplyTimer: Map<string, TimedSet<string>> = new Map();
    @Property("CLEVERBOT_KEY", false)
    private readonly cleverBotKey: string;

    public constructor(private _roleManager: RoleManager,
                       private _logManager: LogChannelManager) {
    }

    @MessageListenerDecorator(false, [notBot])
    private async replier([message]: ArgsOf<"messageCreate">): Promise<void> {
        if (!ObjectUtil.validString(this.cleverBotKey) || !message.member) {
            return;
        }
        const guildId = message.guildId;
        if (!this._autoReplyTimer.has(guildId)) {
            this._autoReplyTimer.set(guildId, new TimedSet(60000));
        }
        const me = message.guild.members.me;
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
            if (!repliedMessageObj.member || repliedMessageObj.member.id !== me.id) {
                return;
            }
        }
        const inTimer = this._autoReplyTimer.get(guildId).rawSet.find(id => id === userId) ?? null;
        if (ObjectUtil.validString(inTimer)) {
            this._autoReplyTimer.get(guildId).refresh(userId);
        }
        if (!shouldReply || ObjectUtil.validString(inTimer)) {
            return;
        }
        this._autoReplyTimer.get(guildId).add(userId);
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

}
