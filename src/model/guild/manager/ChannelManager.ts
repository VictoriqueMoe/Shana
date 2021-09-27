import {BaseDAO} from "../../../DAO/BaseDAO";
import {PostableChannelModel} from "../../DB/guild/PostableChannel.model";
import {TextChannel} from "discord.js";
import {ObjectUtil} from "../../../utils/Utils";
import {GuildManager} from "./GuildManager";
import {singleton} from "tsyringe";

@singleton()
export class ChannelManager extends BaseDAO<PostableChannelModel> {

    public constructor(private _guildManager: GuildManager) {
        super();
    }

    private static getModel(guildId: string, attra: "logChannel" | "AdminLogchannel" | "JailChannel"): Promise<PostableChannelModel> {
        return PostableChannelModel.findOne({
            attributes: [attra],
            where: {
                guildId
            }
        });
    }

    public async setChannel(guildId: string, channelType: "logChannel" | "AdminLogchannel" | "JailChannel", value: string): Promise<PostableChannelModel[] | null> {
        const result = await PostableChannelModel.update({
            [channelType]: value
        }, {
            where: {
                guildId
            }
        });
        if (result[0] === 0) {
            return null;
        }
        return result[1];
    }

    public async getLogChannel(guildId: string): Promise<TextChannel | null> {
        const model = await ChannelManager.getModel(guildId, "logChannel");
        if (!model || !ObjectUtil.validString(model.logChannel)) {
            return null;
        }
        const channelId = model.logChannel;
        const guild = await this._guildManager.getGuild(guildId);
        const channel = guild.channels.resolve(channelId);
        if (channel instanceof TextChannel) {
            return channel;
        }
        throw new Error("Log channel is NOT text channel");
    }

    public async getAdminLogChannel(guildId: string): Promise<TextChannel | null> {
        const model = await ChannelManager.getModel(guildId, "AdminLogchannel");
        if (!model || !ObjectUtil.validString(model.AdminLogchannel)) {
            return null;
        }
        const channelId = model.AdminLogchannel;
        const guild = await this._guildManager.getGuild(guildId);
        const channel = await guild.channels.resolve(channelId);
        if (channel instanceof TextChannel) {
            return channel;
        }
        throw new Error("Admin log channel is NOT text channel");
    }

    public async getJailChannel(guildId: string): Promise<TextChannel | null> {
        const model = await ChannelManager.getModel(guildId, "JailChannel");
        if (!model || !ObjectUtil.validString(model.JailChannel)) {
            return null;
        }
        const channelId = model.JailChannel;
        const guild = await this._guildManager.getGuild(guildId);
        const channel = await guild.channels.resolve(channelId);
        if (channel instanceof TextChannel) {
            return channel;
        }
        throw new Error("Jail Channel is NOT text channel");
    }
}