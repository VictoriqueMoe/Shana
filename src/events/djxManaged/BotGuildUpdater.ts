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

    @On({
        event: "guildCreate"
    })
    private async botJoins([guild]: ArgsOf<"guildCreate">): Promise<void> {
        const model = DbUtils.build(GuildableModel, {
            guildId: guild.id
        });
        await this.ds.manager.save(GuildableModel, [model]);
        return this._onReady.init().then(() => {
            logger.info(`Joined server "${guild.name}"`);
        }).catch(e => {
            logger.error(e);
        });
    }

    @On({
        event: "guildDelete"
    })
    private async botLeaves([guild]: ArgsOf<"guildDelete">): Promise<void> {
        logger.info(`Bot left guild: "${guild.name}" deleting all related data...`);
        await this.ds.getRepository(GuildableModel).delete({
            guildId: guild.id
        });
    }
}
