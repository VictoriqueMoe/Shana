import {ArgsOf, Discord, On} from "discordx";
import {DataSource} from "typeorm";
import {injectable} from "tsyringe";
import {OnReady} from "./OnReady.js";
import {GuildableModel} from "../model/DB/entities/guild/Guildable.model.js";
import {DbUtils} from "../utils/Utils.js";

@Discord()
@injectable()
export class BotGuildUpdater {

    public constructor(private _onReady: OnReady, private _ds: DataSource) {
    }

    @On("guildCreate")
    private async botJoins([guild]: ArgsOf<"guildCreate">): Promise<void> {
        const model = DbUtils.build(GuildableModel, {
            guildId: guild.id
        });
        await this._ds.manager.save(GuildableModel, [model]);
        return this._onReady.init().then(() => {
            console.log(`Joined server "${guild.name}"`);
        }).catch(e => {
            console.error(e);
        });
    }

    @On("guildDelete")
    private async botLeaves([guild]: ArgsOf<"guildDelete">): Promise<void> {
        console.log(`Bot left guild: "${guild.name}" deleting all related data...`);
        await this._ds.getRepository(GuildableModel).delete({
            guildId: guild.id
        });
    }
}
