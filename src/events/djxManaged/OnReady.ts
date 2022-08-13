import {ArgsOf, Client, Discord, On} from "discordx";
import {container, injectable} from "tsyringe";
import type {EntityManager} from "typeorm";
import Immutable from "immutable";
import {DbUtils, ObjectUtil} from "../../utils/Utils.js";
import {CloseOptionModel} from "../../model/DB/entities/autoMod/impl/CloseOption.model.js";
import {ICloseableModule} from "../../model/closeableModules/ICloseableModule.js";
import {CloseableModuleManager} from "../../model/framework/manager/CloseableModuleManager.js";
import {DataSourceAware} from "../../model/DB/DAO/DataSourceAware.js";
import logger from "../../utils/LoggerFactory.js";
import {SubModuleManager} from "../../model/framework/manager/SubModuleManager.js";
import {FilterModuleManager} from "../../model/framework/manager/FilterModuleManager.js";
import {GuildableModel} from "../../model/DB/entities/guild/Guildable.model.js";

@Discord()
@injectable()
export class OnReady extends DataSourceAware {

    public constructor(private _client: Client,
                       private _subModuleManager: SubModuleManager,
                       private _filterModuleManager: FilterModuleManager) {
        super();
    }

    public async init(): Promise<void> {
        await this._ds.transaction(async (transactionalEntityManager: EntityManager) => {
            await this.populateClosableEvents(transactionalEntityManager);
        });
        await this.populateDefaultsSubModules();
    }

    @On("ready")
    private async initialise([client]: ArgsOf<"ready">): Promise<void> {
        await client.user.setActivity('Half-Life 3', {type: 0});
        await this.populateGuilds();
        await this.init();
        logger.info("Bot logged in!");
    }

    private async populateGuilds(): Promise<void> {
        const guilds = this._client.guilds.cache;
        return this._ds.transaction(async transactionManager => {
            for (const [guildId] of guilds) {
                if (await transactionManager.count(GuildableModel, {
                    where: {
                        guildId
                    }
                }) === 0) {
                    const guild = DbUtils.build(GuildableModel, {
                        guildId
                    });
                    await transactionManager.save(GuildableModel, guild);
                }
            }
        });
    }

    private async populateClosableEvents(transactionManager: EntityManager): Promise<void> {
        const allModules: Immutable.Set<ICloseableModule<unknown>> = container.resolve(CloseableModuleManager).closeableModules;
        for (const module of allModules) {
            for (const [guildId, guild] of this._client.guilds.cache) {
                const moduleId = module.moduleId;
                const modelPersisted = await transactionManager.findOne(CloseOptionModel, {
                    where: {
                        moduleId,
                        guildId
                    }
                });
                if (modelPersisted) {
                    if (modelPersisted.status) {
                        const moduleName = ObjectUtil.validString(module.constructor.name) ? module.constructor.name : "";
                        logger.info(`Module: ${modelPersisted.moduleId} (${moduleName})for guild "${guild.name}" (${guildId}) enabled`);
                    }
                } else {
                    const m = DbUtils.build(CloseOptionModel, {
                        moduleId,
                        guildId
                    });
                    await transactionManager.save(CloseOptionModel, m);
                }
            }
        }
    }

    private async populateDefaultsSubModules(): Promise<void> {
        await this._subModuleManager.initDefaults(this._client);
        await this._filterModuleManager.initDefaults(this._client);
    }
}
