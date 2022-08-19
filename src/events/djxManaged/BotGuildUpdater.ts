import {ArgsOf, Discord, On} from "discordx";
import {injectable} from "tsyringe";
import {OnReady} from "./OnReady.js";
import {GuildableModel} from "../../model/DB/entities/guild/Guildable.model.js";
import {DbUtils} from "../../utils/Utils.js";
import {DataSourceAware} from "../../model/DB/DAO/DataSourceAware.js";
import logger from "../../utils/LoggerFactory.js";
import {Property} from "../../model/framework/decorators/Property.js";
import {Typeings} from "../../model/Typeings.js";
import propTypes = Typeings.propTypes;

@Discord()
@injectable()
export class BotGuildUpdater extends DataSourceAware {

    @Property("NODE_ENV")
    private readonly envMode: propTypes["NODE_ENV"];

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
        if (this.envMode === "development") {
            await this._onReady.initAppCommands();
        }
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
