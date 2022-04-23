import type {ArgsOf, Client} from "discordx";
import {Discord, On} from "discordx";
import {BaseDAO} from "../DAO/BaseDAO";
import {GuildableModel} from "../model/DB/entities/guild/Guildable.model";
import type {OnReady} from "./OnReady";
import {getRepository} from "typeorm";
import {injectable} from "tsyringe";

@Discord()
@injectable()
export class BotGuildUpdater extends BaseDAO<GuildableModel> {

    public constructor(private _onReady: OnReady) {
        super();
    }

    @On("guildCreate")
    private async botJoins([guild]: ArgsOf<"guildCreate">, client: Client): Promise<void> {
        const model = BaseDAO.build(GuildableModel, {
            guildId: guild.id
        });
        await super.commitToDatabase(getRepository(GuildableModel), [model]);
        return this._onReady.init().then(() => {
            console.log(`Joined server "${guild.name}"`);
        }).catch(e => {
            console.error(e);
        });
    }

    @On("guildDelete")
    private async botLeaves([guild]: ArgsOf<"guildDelete">, client: Client): Promise<void> {
        console.log(`Bot left guild: "${guild.name}" deleting all related data...`);
        await getRepository(GuildableModel).delete({
            guildId: guild.id
        });
    }
}
