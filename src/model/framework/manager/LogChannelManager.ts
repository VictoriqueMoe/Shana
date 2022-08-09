import {singleton} from "tsyringe";
import {BaseGuildTextChannel, EmbedBuilder, Message} from "discord.js";
import {ObjectUtil} from "../../../utils/Utils.js";
import {ChannelManager} from "./ChannelManager.js";
import logger from "../../../utils/LoggerFactory.js";
import Channels from "../../../enums/Channels.js";

@singleton()
export class LogChannelManager {

    public constructor(private _channelManager: ChannelManager) {
    }

    public async postToLog(message: EmbedBuilder[] | string, guildId: string, adminLog = false): Promise<Message | null> {
        let channel: BaseGuildTextChannel;
        if (adminLog) {
            channel = await this._channelManager.getChannel(guildId, Channels.ADMIN_LOG_CHANNEL);
        } else {
            channel = await this._channelManager.getChannel(guildId, Channels.LOG_CHANNEL);
        }
        if (channel == null) {
            return null;
        }
        try {
            if (ObjectUtil.isValidArray(message)) {
                return channel.send({embeds: message});
            } else {
                return channel.send(message);
            }
        } catch (e) {
            logger.warn(e.message);
        }
    }
}
