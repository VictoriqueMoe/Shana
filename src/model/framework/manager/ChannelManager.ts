import {BaseDAO} from "../../../DAO/BaseDAO";
import {PostableChannelModel} from "../../DB/entities/guild/PostableChannel.model";
import {BaseGuildTextChannel} from "discord.js";
import {ObjectUtil} from "../../../utils/Utils";
import {GuildManager} from "./GuildManager";
import {singleton} from "tsyringe";
import {getRepository} from "typeorm";
import {Channels} from "../../../enums/Channels";

@singleton()
export class ChannelManager extends BaseDAO<PostableChannelModel> {

    public constructor(private _guildManager: GuildManager) {
        super();
    }

    private getModel(guildId: string): Promise<PostableChannelModel> {
        return getRepository(PostableChannelModel).findOne({
            where: {
                guildId
            }
        });
    }

    public async setChannel(guildId: string, channelType: Channels, value: string): Promise<PostableChannelModel[] | null> {
        const result = await getRepository(PostableChannelModel).update({
            guildId
        }, {
            [channelType]: value
        });
        if (result.affected === 0) {
            return null;
        }
        return result[1];
    }

    public async getChannel(guildId: string, channelEnum: Channels): Promise<BaseGuildTextChannel | null> {
        const model = await this.getModel(guildId);
        if (!model || !ObjectUtil.validString(model[channelEnum])) {
            return null;
        }
        const channelId = model[channelEnum] as string;
        const guild = await this._guildManager.getGuild(guildId);
        const channel = guild.channels.resolve(channelId);
        if (channel instanceof BaseGuildTextChannel) {
            return channel;
        }
        throw new Error(`"${channel.name}" is NOT text channel`);
    }
}
