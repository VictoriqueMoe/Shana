import {BaseDAO} from "../../../DAO/BaseDAO";
import {GuildableModel} from "../../DB/guild/Guildable.model";
import {Guild} from "discord.js";
import {Main} from "../../../Main";
import {singleton} from "tsyringe";

@singleton()
export class GuildManager extends BaseDAO<GuildableModel> {

    public async getGuilds(): Promise<Guild[]> {
        const retArray: Guild[] = [];
        const models = await GuildableModel.findAll();
        for (const model of models) {
            const guild = await Main.client.guilds.fetch(model.guildId);
            retArray.push(guild);
        }
        return retArray;
    }

    public async getGuild(guildId: string): Promise<Guild | null> {
        return Main.client.guilds.fetch(guildId);
    }

}