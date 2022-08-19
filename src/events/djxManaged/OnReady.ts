import {ArgsOf, Client, Discord, DIService, On} from "discordx";
import {container, delay, inject, injectable} from "tsyringe";
import type {EntityManager} from "typeorm";
import {InsertResult} from "typeorm";
import Immutable from "immutable";
import {DbUtils, DiscordUtils, EnumEx, ObjectUtil} from "../../utils/Utils.js";
import {CloseOptionModel} from "../../model/DB/entities/autoMod/impl/CloseOption.model.js";
import {ICloseableModule} from "../../model/closeableModules/ICloseableModule.js";
import {CloseableModuleManager} from "../../model/framework/manager/CloseableModuleManager.js";
import {DataSourceAware} from "../../model/DB/DAO/DataSourceAware.js";
import logger from "../../utils/LoggerFactory.js";
import {SubModuleManager} from "../../model/framework/manager/SubModuleManager.js";
import {FilterModuleManager} from "../../model/framework/manager/FilterModuleManager.js";
import {GuildableModel} from "../../model/DB/entities/guild/Guildable.model.js";
import {ActivityType, InteractionType} from "discord-api-types/v10";
import {SettingsManager} from "../../model/framework/manager/SettingsManager.js";
import SETTINGS, {DEFAULT_SETTINGS} from "../../enums/SETTINGS.js";
import {PostableChannelModel} from "../../model/DB/entities/guild/PostableChannel.model.js";
import {LogChannelManager} from "../../model/framework/manager/LogChannelManager.js";
import {UsernameManager} from "../../model/framework/manager/UsernameManager.js";
import {ChannelType} from "discord.js";
import {Property} from "../../model/framework/decorators/Property.js";
import {Typeings} from "../../model/Typeings.js";
import InteractionUtils = DiscordUtils.InteractionUtils;
import propTypes = Typeings.propTypes;

@Discord()
@injectable()
export class OnReady extends DataSourceAware {

    @Property("NODE_ENV")
    private readonly envMode: propTypes["NODE_ENV"];

    public constructor(private _client: Client,
                       @inject(delay(() => SubModuleManager)) private _subModuleManager: SubModuleManager,
                       private _logManager: LogChannelManager,
                       private _filterModuleManager: FilterModuleManager,
                       private _usernameManager: UsernameManager) {
        super();
    }

    /**
     * Commands that are run on application start AND on join new guild
     */
    public async init(): Promise<void> {
        await this.populateClosableEvents();
        await this.cleanUpGuilds();
        await this.ds.transaction(async (transactionalEntityManager: EntityManager) => {
            await this.setDefaultSettings(transactionalEntityManager);
            await this.populatePostableChannels(transactionalEntityManager);
            await this.joinThreads();
        });
        await this.initModuleSettings();
    }

    public async setDefaultSettings(manager: EntityManager): Promise<void> {
        const guilds = this._client.guilds;
        const cache = guilds.cache;
        const nameValue = EnumEx.getNamesAndValues(DEFAULT_SETTINGS) as any;
        const settingsManager = container.resolve(SettingsManager);
        for (const [guildId] of cache) {
            for (const keyValuesObj of nameValue) {
                const setting: SETTINGS = keyValuesObj.name;
                let value = keyValuesObj.value;
                if (!ObjectUtil.validString(value)) {
                    value = null;
                }
                await settingsManager.saveOrUpdateSetting(setting, value, guildId, true, manager);
            }
        }
    }

    private async joinThreads(): Promise<void> {
        const guilds = [...this._client.guilds.cache.values()];
        for (const guild of guilds) {
            const threads = await guild.channels.fetchActiveThreads(true);
            for (const [, thread] of threads.threads) {
                if (thread.joinable && !thread.joined) {
                    await thread.join();
                    await this._logManager.postToLog(`joined thread: "${thread.name}"`, thread.guildId);
                }
            }
        }
    }

    public async initAppCommands(): Promise<void> {
        if (this.envMode === "production") {
            for (const [guildId] of this._client.guilds.cache) {
                await this._client.clearApplicationCommands(guildId);
            }
        }
        return this._client.initApplicationCommands();
    }

    private async cleanUpGuilds(): Promise<void> {
        const transactionManager = this.ds.manager;
        const guildsJoined = [...this._client.guilds.cache.keys()];
        if (!ObjectUtil.isValidArray(guildsJoined)) {
            await transactionManager.clear(GuildableModel);
            await this.ds.queryResultCache.clear();
            return;
        }
        for (const guildsJoinedId of guildsJoined) {
            const guildModels = await transactionManager.find(GuildableModel, {
                where: {
                    "guildId": guildsJoinedId
                }
            });
            if (!guildModels) {
                await transactionManager.delete(GuildableModel, {
                    guildId: guildsJoinedId,
                });
            }
        }
    }

    private async populatePostableChannels(manager: EntityManager): Promise<InsertResult | any[]> {
        const currentModels = await manager.find(PostableChannelModel);
        const models: PostableChannelModel[] = [];
        for (const [guildId] of this._client.guilds.cache) {
            if (currentModels.some(m => m.guildId === guildId)) {
                continue;
            }
            models.push(DbUtils.build(PostableChannelModel, {
                guildId
            }));
        }
        return manager.save(models);
    }

    @On({
        event: "ready"
    })
    private async initialise([client]: ArgsOf<"ready">): Promise<void> {
        client.user.setActivity('Half-Life 3', {type: ActivityType.Playing});
        await this.initAppCommands();
        const pArr: Promise<any>[] = [];
        await this.populateGuilds();
        pArr.push(this.initUsernames());
        await this.init();
        this.initDi();
        return Promise.all(pArr).then(() => {
            logger.info("Bot logged in!");
            if (process.send) {
                process.send('ready');
            }
        });
    }

    @On()
    private async interactionCreate([interaction]: ArgsOf<"interactionCreate">, client: Client): Promise<void> {
        try {
            await client.executeInteraction(interaction);
        } catch (e) {
            if (e instanceof Error) {
                logger.error(e.message);
            } else {
                logger.error(e);
            }
            const me = interaction.guild.members.me;
            if (interaction.type === InteractionType.ApplicationCommand || interaction.type === InteractionType.MessageComponent) {
                const channel = interaction.channel;
                if (channel.type !== ChannelType.GuildText || !channel.permissionsFor(me).has("SendMessages")) {
                    logger.error(`cannot send warning message to this channel`, interaction);
                    return;
                }
                try {
                    await InteractionUtils.replyOrFollowUp(
                        interaction,
                        "Something went wrong, please notify my developer: <@697417252320051291>"
                    );
                } catch (e) {
                    logger.error(e);
                }
            }
        }
    }

    private initDi(): void {
        DIService.allServices;
    }

    private async populateGuilds(): Promise<void> {
        const guilds = this._client.guilds.cache;
        return this.ds.transaction(async transactionManager => {
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

    private async populateClosableEvents(): Promise<void> {
        const allModules: Immutable.Set<ICloseableModule<unknown>> = container.resolve(CloseableModuleManager).closeableModules;
        const transactionManager = this.ds.manager;
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

    private async initModuleSettings(): Promise<void> {
        await this._subModuleManager.initDefaults(this._client);
        await this._filterModuleManager.initDefaults(this._client);
        await this._initSubModules();
    }

    private initUsernames(): Promise<any> {
        return this._usernameManager.init(this._client);
    }

    private async _initSubModules(): Promise<void> {
        const allModules: Immutable.Set<ICloseableModule<unknown>> = container.resolve(CloseableModuleManager).closeableModules;
        for (const module of allModules) {
            for (const [guildId] of this._client.guilds.cache) {
                await module.setDefaults(guildId);
            }
        }
    }
}
