import {BaseDAO} from "../../../DAO/BaseDAO.js";
import {GuildableModel} from "../../DB/guild/Guildable.model.js";
import {Guild} from "discord.js";
import {singleton} from "tsyringe";
import {Client} from "discordx";
import {getRepository} from "typeorm";

@singleton()
export class GuildManager extends BaseDAO<GuildableModel> {


    constructor(private _client: Client) {
        super();
    }

    public async getGuilds(): Promise<Guild[]> {
        const retArray: Guild[] = [];
        const models = await getRepository(GuildableModel).find();
        for (const model of models) {
            const guild = await this._client.guilds.fetch(model.guildId);
            retArray.push(guild);
        }
        return retArray;
    }

    public async getGuild(guildId: string): Promise<Guild | null> {
        return this._client.guilds.fetch(guildId);
    }

}