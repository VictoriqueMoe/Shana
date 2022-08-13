import {PostableChannelModel} from "../../DB/entities/guild/PostableChannel.model.js";
import {BaseGuildTextChannel} from "discord.js";
import {DiscordUtils, ObjectUtil} from "../../../utils/Utils.js";
import {singleton} from "tsyringe";
import {DataSourceAware} from "../../DB/DAO/DataSourceAware.js";
import Channels from "../../../enums/Channels.js";

@singleton()
export class ChannelManager extends DataSourceAware {

    public constructor() {
        super();
    }

    public async setChannel(guildId: string, channelType: Channels, value: string): Promise<PostableChannelModel[] | null> {
        const result = await this._ds.getRepository(PostableChannelModel).update({
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
        const guild = await DiscordUtils.getGuild(guildId);
        const channel = guild.channels.resolve(channelId);
        if (channel instanceof BaseGuildTextChannel) {
            return channel;
        }
        throw new Error(`"${channel.name}" is NOT text channel`);
    }

    private getModel(guildId: string): Promise<PostableChannelModel> {
        return this._ds.getRepository(PostableChannelModel).findOne({
            where: {
                guildId
            }
        });
    }
}
