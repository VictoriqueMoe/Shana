import {ArgsOf, Discord, On} from "discordx";
import {injectable} from "tsyringe";
import {OnReady} from "./OnReady.js";
import {GuildableModel} from "../../model/DB/entities/guild/Guildable.model.js";
import {DbUtils} from "../../utils/Utils.js";
import {DataSourceAware} from "../../model/DB/DAO/DataSourceAware.js";
import logger from "../../utils/LoggerFactory.js";

@Discord()
@injectable()
export class BotGuildUpdater extends DataSourceAware {

    public constructor(private _onReady: OnReady) {
        super();
    }

    @On("guildCreate")
    private async botJoins([guild]: ArgsOf<"guildCreate">): Promise<void> {
        const model = DbUtils.build(GuildableModel, {
            guildId: guild.id
        });
        await this._ds.manager.save(GuildableModel, [model]);
        return this._onReady.init().then(() => {
            logger.info(`Joined server "${guild.name}"`);
        }).catch(e => {
            logger.error(e);
        });
    }

    @On("guildDelete")
    private async botLeaves([guild]: ArgsOf<"guildDelete">): Promise<void> {
        logger.info(`Bot left guild: "${guild.name}" deleting all related data...`);
        await this._ds.getRepository(GuildableModel).delete({
            guildId: guild.id
        });
    }
}
