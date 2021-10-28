import {ArgsOf, Client, Discord, On} from "discordx";
import {BaseDAO} from "../DAO/BaseDAO";
import {GuildableModel} from "../model/DB/guild/Guildable.model";
import {OnReady} from "./OnReady";
import {container} from "tsyringe";

@Discord()
export class BotGuildUpdater extends BaseDAO<GuildableModel> {

    @On("guildCreate")
    private async botJoins([guild]: ArgsOf<"guildCreate">, client: Client): Promise<void> {
        const model = new GuildableModel({
            guildId: guild.id
        });
        await super.commitToDatabase(model);
        const onReadyClass: OnReady = container.resolve(OnReady);
        return onReadyClass.init().then(pArr => {
            Promise.all(pArr).then(() => {
                console.log(`Joined server "${guild.name}"`);
            }).catch(e => {
                console.error(e);
            });
        });
    }

    @On("guildDelete")
    private async botLeaves([guild]: ArgsOf<"guildDelete">, client: Client): Promise<void> {
        console.log(`Bot left guild: "${guild.name}" deleting all related data...`);
        await GuildableModel.destroy({
            cascade: true,
            where: {
                guildId: guild.id
            }
        });
    }
}