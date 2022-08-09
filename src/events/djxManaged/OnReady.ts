import {Client, Discord, On} from "discordx";
import {container, injectable} from "tsyringe";
import type {EntityManager} from "typeorm";
import Immutable from "immutable";
import {DbUtils, ObjectUtil} from "../../utils/Utils.js";
import {CloseOptionModel} from "../../model/DB/entities/autoMod/impl/CloseOption.model.js";
import {ICloseableModule} from "../../model/closeableModules/ICloseableModule.js";
import {CloseableModuleManager} from "../../model/framework/manager/CloseableModuleManager.js";
import {DataSourceAware} from "../../model/DB/DAO/DataSourceAware.js";
import logger from "../../utils/LoggerFactory.js";

@Discord()
@injectable()
export class OnReady extends DataSourceAware {

    public constructor(private _client: Client) {
        super();
    }

    public async init(): Promise<void> {
        await this._ds.transaction(async (transactionalEntityManager: EntityManager) => {
            await this.populateClosableEvents(transactionalEntityManager);
            await this.setDefaultSettings(manager);
            await this.populatePostableChannels(manager);
            await this.cleanUpGuilds(manager);
        });
        await this.initAppCommands();
        await this.joinThreads();
    }

    @On("ready")
    private async initialise([client]: [Client]): Promise<void> {

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
                    await transactionManager.save(CloseOptionModel, [m]);
                }
            }
        }
    }
}
