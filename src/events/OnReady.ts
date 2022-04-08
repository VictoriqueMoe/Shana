import {Main} from "../Main";
import {ArrayUtils, DiscordUtils, EnumEx, loadClasses, ObjectUtil} from "../utils/Utils";
import {BaseDAO, UniqueViolationError} from "../DAO/BaseDAO";
import {BotServer} from "../api/BotServer";
import {GuildableModel} from "../model/DB/guild/Guildable.model";
import {CommandSecurityModel} from "../model/DB/guild/CommandSecurity.model";
import {PostableChannelModel} from "../model/DB/guild/PostableChannel.model";
import {CloseOptionModel} from "../model/DB/autoMod/impl/CloseOption.model";
import * as fs from 'fs';
import {SettingsManager} from "../model/settings/SettingsManager";
import {ArgsOf, Client, Discord, On} from "discordx";
import {container, injectable} from "tsyringe";
import {CommandSecurityManager} from "../model/guild/manager/CommandSecurityManager";
import {DEFAULT_SETTINGS, SETTINGS} from "../enums/SETTINGS";
import {EntityManager, getManager, getRepository, Transaction, TransactionManager} from "typeorm";
import {InsertResult} from "typeorm/browser";
import io from "@pm2/io";
import {ICloseableModule} from "../model/closeableModules/ICloseableModule";
import Immutable from "immutable";
import {CloseableModuleManager} from "../model/guild/manager/CloseableModuleManager";
import {AutoRole} from "./closeableModules/autoRole/AutoRole";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@injectable()
export class OnReady extends BaseDAO<any> {
    private readonly classesToLoad = [`${__dirname}/../model/closeableModules/subModules/dynoAutoMod/impl/*.{ts,js}`, `${__dirname}/../managedEvents/**/*.{ts,js}`];

    public constructor(private _client: Client) {
        super();
    }

    private static async startServer(): Promise<void> {
        if (Main.testMode) {
            return;
        }
        container.resolve(BotServer);
    }

    /**
     * Commands that are run on application start AND on join new guild
     */
    @Transaction()
    public async init(@TransactionManager() manager?: EntityManager): Promise<void> {
        await this.populateCommandSecurity(manager);
        await this.populateClosableEvents(manager);
        await this.setDefaultSettings(manager);
        await this.populatePostableChannels(manager);
        await this.cleanUpGuilds(manager);
        await this.initAppCommands();
        await this.joinThreads();
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

    @On("ready")
    private async initialise([client]: ArgsOf<"ready">): Promise<void> {
        if (Main.testMode) {
            await this._client.user.setActivity("Under development", {type: "LISTENING"});
            await this._client.user.setPresence({
                status: "idle"
            });
        } else {
            await this._client.user.setActivity('Half-Life 3', {type: 'PLAYING'});
        }
        const pArr: Promise<any>[] = [];
        await this.populateGuilds();
        pArr.push(this.initUsernames());
        await this.init();
        // wait for the initial transaction to finish
        pArr.push(loadClasses(...this.classesToLoad));
        pArr.push(OnReady.startServer());
        pArr.push(this.loadCustomActions());
        return Promise.all(pArr).then(() => {
            console.log("Bot logged in.");
            if (process.send) {
                process.send('ready');
            }
        });
    }

    @On("interactionCreate")
    private async intersectionInit([interaction]: ArgsOf<"interactionCreate">): Promise<void> {
        try {
            await this._client.executeInteraction(interaction);
        } catch (e) {
            console.error(e);
            if (interaction.isApplicationCommand() || interaction.isMessageComponent()) {
                return InteractionUtils.replyOrFollowUp(interaction, "Something went wrong, please notify my developer: <@697417252320051291>");
            }
        }
    }

    private async loadCustomActions(): Promise<void> {
        io.action('getLogs', async (cb) => {
            const url = `${__dirname}/../../logs/combined.log`;
            const log = fs.readFileSync(url, {
                encoding: 'utf8'
            });
            return cb(log);
        });

        io.action("refresh permissions", async cb => {
            await this._client.initApplicationPermissions();
            cb("Permissions refreshed");
        });

        io.action('Refresh settings cache', async (cb) => {
            const settingsManager = container.resolve(SettingsManager);
            settingsManager.refresh();
            return cb("Settings refreshed");
        });

        io.action('force member roles', async (cb) => {
            const autoRole = container.resolve(CloseableModuleManager).getCloseableModule(AutoRole);
            const appliedMembers = await autoRole.applyEmptyRoles();
            let message = "";
            for (const [guild, members] of appliedMembers) {
                if (members.length === 0) {
                    continue;
                }
                message += `\n----- ${guild.name} ----`;
                for (const member of members) {
                    message += `\n${member}\n`;
                }
                message += `---------\n`;
            }
            if (!ObjectUtil.validString(message)) {
                message = "No Members with no roles found";
            }
            return cb(message);
        });
    }

    private async initAppCommands(): Promise<void> {
        await this._client.initApplicationCommands();
        return this._client.initApplicationPermissions();
    }

    private async initUsernames(): Promise<void> {
        const allModels = await getRepository(GuildableModel).find({
            relations: ["usernameModel"]
        });
        const pArr: Promise<void>[] = [];
        for (const model of allModels) {
            const guild = await this._client.guilds.fetch(model.guildId);
            const userNameModels = model.usernameModel;
            const innerPromiseArray = userNameModels.map(userNameModel => {
                return guild.members.fetch(userNameModel.userId).then(member => {
                    return member.setNickname(userNameModel.usernameToPersist);
                }).then(member => {
                    console.log(`Set username for "${member.user.username}" to "${userNameModel.usernameToPersist}"`);
                }).catch(reason => {
                    console.log(`Unable to set username for user ${userNameModel.userId} as they no longer exist in this guild`);
                });
            });
            pArr.push(...innerPromiseArray);
        }
        await Promise.all(pArr);
        console.log("set all Usernames");
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
                        console.log(`Module: ${modelPersisted.moduleId} (${moduleName})for guild "${guild.name}" (${guildId}) enabled`);
                    }
                } else {
                    const m = BaseDAO.build(CloseOptionModel, {
                        moduleId,
                        guildId
                    });
                    try {
                        await super.commitToDatabase(transactionManager, [m], CloseOptionModel);
                    } catch (e) {
                        if (!(e instanceof UniqueViolationError)) {
                            throw e;
                        }
                    }
                }
            }
        }
    }

    private async populateGuilds(): Promise<void> {
        const guilds = this._client.guilds.cache;
        return getManager().transaction(async transactionManager => {
            for (const [guildId] of guilds) {
                const guild = BaseDAO.build(GuildableModel, {
                    guildId
                });
                try {
                    await super.commitToDatabase(transactionManager, [guild], GuildableModel, {
                        silentOnDupe: true
                    });
                } catch (e) {
                    if (!(e instanceof UniqueViolationError)) {
                        throw e;
                    }
                }
            }
        });
    }

    private async populateCommandSecurity(transactionManager: EntityManager): Promise<void> {
        const securityManager = container.resolve(CommandSecurityManager);
        const {commands} = securityManager;

        async function addNewCommands(this: OnReady, guildModels: GuildableModel[]): Promise<void> {
            const models: CommandSecurityModel[] = [];
            for (const {name} of commands) {
                for (const guildModel of guildModels) {
                    const guildId = guildModel.guildId;
                    const commandSecurity = guildModel.commandSecurityModel;
                    const inArray = ArrayUtils.isValidArray(commandSecurity) && commandSecurity.some(value => value.commandName.toLowerCase() === name.toLowerCase());
                    if (!inArray) {
                        const newModel = BaseDAO.build(CommandSecurityModel, {
                            commandName: name,
                            guildId
                        });
                        models.push(newModel);
                    }
                }
            }
            if (models.length > 0) {
                console.log(`adding commands: ${models.map(value => value.commandName)}`);
                await this.commitToDatabase(transactionManager, models, CommandSecurityModel);
            }
        }

        async function removeOldCommands(this: OnReady, guildModels: GuildableModel[]): Promise<void> {
            for (const guildModel of guildModels) {
                const {guildId} = guildModel;
                const commandSecurity = guildModel.commandSecurityModel;
                const commandsToDestroy: string[] = [];
                for (const {commandName} of commandSecurity) {
                    const hasInSystem = commands.find(command => command.name.toLowerCase() === commandName.toLowerCase());
                    if (!hasInSystem) {
                        console.log(`delete command ${commandName}`);
                        commandsToDestroy.push(commandName);
                    }
                }
                if (ArrayUtils.isValidArray(commandsToDestroy)) {
                    for (const commandName of commandsToDestroy) {
                        await transactionManager.delete(CommandSecurityModel, {
                            commandName,
                            guildId
                        });
                    }
                }
            }
        }

        const guilds = await transactionManager.find(GuildableModel, {
            relations: ["commandSecurityModel"]
        });
        await addNewCommands.call(this, guilds);
        await removeOldCommands.call(this, guilds);
    }

    private async populatePostableChannels(manager: EntityManager): Promise<InsertResult | any[]> {
        const guildModels = await getRepository(GuildableModel).find({
            relations: ["commandSecurityModel"]
        });
        const currentModels = await manager.find(PostableChannelModel);
        const models: {
            guildId: string
        }[] = [];
        for (const guildModel of guildModels) {
            const guildId = guildModel.guildId;
            if (currentModels.some(m => m.guildId === guildId)) {
                continue;
            }
            models.push({
                guildId
            });
        }
        return super.commitToDatabase(manager, models, PostableChannelModel);
    }

    private async cleanUpGuilds(transactionManager: EntityManager): Promise<void> {
        const guildsJoined = [...this._client.guilds.cache.keys()];
        for (const guildsJoinedId of guildsJoined) {
            const guildModels = await transactionManager.find(GuildableModel, {
                where: {
                    "guildId": guildsJoinedId
                }
            });
            if (!guildModels) {
                await transactionManager.delete(GuildableModel, {
                    guildId: guildsJoinedId
                });
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
                    await DiscordUtils.postToLog(`joined thread: "${thread.name}"`, thread.guildId);
                }
            }
        }
    }
}
