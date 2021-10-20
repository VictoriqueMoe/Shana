import {Main} from "../Main";
import {VicDropbox} from "../model/dropbox/VicDropbox";
import {MuteModel} from "../model/DB/autoMod/impl/Mute.model";
import {Op} from "sequelize";
import {ArrayUtils, DiscordUtils, EnumEx, GuildUtils, loadClasses, ObjectUtil} from "../utils/Utils";
import {Guild} from "discord.js";
import {UsernameModel} from "../model/DB/autoMod/impl/Username.model";
import {BaseDAO, UniqueViolationError} from "../DAO/BaseDAO";
import {MuteManager} from "../model/guild/manager/MuteManager";
import {BotServer} from "../api/BotServer";
import {GuildableModel} from "../model/DB/guild/Guildable.model";
import {CommandSecurityModel} from "../model/DB/guild/CommandSecurity.model";
import {PostableChannelModel} from "../model/DB/guild/PostableChannel.model";
import {CloseOptionModel} from "../model/DB/autoMod/impl/CloseOption.model";
import {AutoRole} from "./closeableModules/autoRole/AutoRole";
import {GuildManager} from "../model/guild/manager/GuildManager";
import * as fs from 'fs';
import {SettingsManager} from "../model/settings/SettingsManager";
import {ArgsOf, Client, Discord, On} from "discordx";
import {container, injectable} from "tsyringe";
import {CommandSecurityManager} from "../model/guild/manager/CommandSecurityManager";
import {CloseableModule} from "../model/closeableModules/impl/CloseableModule";
import {Sequelize} from "sequelize-typescript";
import {DEFAULT_SETTINGS, SETTINGS} from "../enums/SETTINGS";
import {Player} from "discord-music-player";
import {registerInstance} from "../DI/moduleRegistrar";

const io = require('@pm2/io');

@Discord()
@injectable()
export class OnReady extends BaseDAO<any> {
    private readonly classesToLoad = [`${__dirname}/../model/closeableModules/subModules/dynoAutoMod/impl/*.{ts,js}`, `${__dirname}/../managedEvents/**/*.{ts,js}`];

    public constructor(private _client: Client, private _dao: Sequelize) {
        super();
    }


    private async initiateMuteTimers(): Promise<void> {
        const mutesWithTimers = await MuteModel.findAll({
            where: {
                timeout: {
                    [Op.not]: null
                }
            }
        });
        const now = Date.now();
        const muteSingleton = container.resolve(MuteManager);
        for (const mute of mutesWithTimers) {
            const mutedRole = await GuildUtils.RoleUtils.getMuteRole(mute.guildId);
            if (!mutedRole) {
                continue;
            }
            const muteCreated = (mute.createdAt as Date).getTime();
            const timerLength = mute.timeout;
            const timeLeft = timerLength - (now - muteCreated);
            const guild: Guild = await this._client.guilds.fetch(mute.guildId);
            if (timeLeft <= 0) {
                console.log(`Timer has expired for user ${mute.username}, removing from database`);
                await MuteModel.destroy({
                    where: {
                        id: mute.id,
                        guildId: mute.guildId
                    }
                });
            } else {
                console.log(`Re-creating timed mute for ${mute.username}, time remaining is: ${ObjectUtil.timeToHuman(timeLeft)}`);
                muteSingleton.createTimeout(mute.userId, mute.username, timeLeft, guild);
            }
        }
    }

    private async cleanCommands(justGuilds: boolean): Promise<void> {
        if (justGuilds) {
            const guildManager = container.resolve(GuildManager);
            for (const guild of await guildManager.getGuilds()) {
                try {
                    await this._client.clearApplicationCommands(guild.id);
                } catch {

                }
            }
        } else {
            await this._client.clearApplicationCommands();
        }
    }

    private static async applyEmptyRoles(): Promise<Map<Guild, string[]>> {
        const retMap: Map<Guild, string[]> = new Map();
        const guildModels = await GuildableModel.findAll({
            include: [CommandSecurityModel]
        });
        const guildManager = container.resolve(GuildManager);
        for (const guildModel of guildModels) {
            const guildId = guildModel.guildId;
            const guild = await guildManager.getGuild(guildId);
            const autoRoleModule = container.resolve(AutoRole);
            const enabled = await autoRoleModule.isEnabled(guildId);
            if (enabled) {
                const membersApplied: string[] = [];
                const members = await guild.members.fetch({
                    force: true
                });
                const noRoles = [...members.values()].filter(member => {
                    const roles = [...member.roles.cache.values()];
                    for (const role of roles) {
                        if (role.name !== "@everyone") {
                            return false;
                        }
                    }
                    return true;
                });
                for (const noRole of noRoles) {
                    console.log(`setting roles for ${noRole.user.tag} as they have no roles`);
                    membersApplied.push(noRole.user.tag);
                    await autoRoleModule.applyRole(noRole, guildId);
                }
                retMap.set(guild, membersApplied);
            }
        }
        return retMap;
    }

    private async loadCustomActions(): Promise<void> {
        io.action('getLogs', async (cb) => {
            const url = `${__dirname}/../../logs/combined.log`;
            const log = fs.readFileSync(url, {
                encoding: 'utf8'
            });
            return cb(log);
        });

        io.action("Re init commands (globally)", async cb => {
            await this.cleanCommands(false);
            await this.initAppCommands();
            return cb("Slash Commands reset");
        });

        io.action("Re init commands (guilds only)", async cb => {
            await this.cleanCommands(true);
            await this.initAppCommands();
            return cb("Slash Commands reset");
        });

        io.action('Refresh settings cache', async (cb) => {
            const settingsManager = container.resolve(SettingsManager);
            settingsManager.refresh();
            return cb("Settings refreshed");
        });

        io.action('force member roles', async (cb) => {
            const appliedMembers = await OnReady.applyEmptyRoles();
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

    /**
     * Commands that are run on application start AND on join new guild
     */
    public init(): Promise<any>[] {
        const pArr: Promise<any>[] = [];
        pArr.push(this.populateClosableEvents());
        pArr.push(this.setDefaultSettings());
        pArr.push(this.populateCommandSecurity());
        pArr.push(this.populatePostableChannels());
        pArr.push(this.cleanUpGuilds());
        pArr.push(this.initAppCommands());
        return pArr;
    }

    @On("interactionCreate")
    private async intersectionInit([interaction]: ArgsOf<"interactionCreate">): Promise<void> {
        await this._client.executeInteraction(interaction);
    }

    @On("ready")
    private async initialize([client]: ArgsOf<"ready">): Promise<void> {
        if (Main.testMode) {
            await this._client.user.setActivity("Under development", {type: "LISTENING"});
            await this._client.user.setPresence({
                status: "idle"
            });
        } else {
            await this._client.user.setActivity('Half-Life 3', {type: 'PLAYING'});
        }
        const vicDropbox = container.resolve(VicDropbox);
        const pArr: Promise<any>[] = [];
        await this.populateGuilds();
        // await OnReady.cleanCommands(true);
        this.initMusicPlayer();
        pArr.push(vicDropbox.index());
        pArr.push(this.initiateMuteTimers());
        pArr.push(this.initUsernames());
        pArr.push(...this.init());
        pArr.push(OnReady.applyEmptyRoles());
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

    public initMusicPlayer(): void {
        const player = new Player(this._client, {
            leaveOnEmpty: true,
            quality: "high"
        });
        registerInstance(player);
    }

    public async setDefaultSettings(): Promise<void> {
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
                await settingsManager.saveOrUpdateSetting(setting, value, guildId, true);
            }
        }
    }

    private async initAppCommands(): Promise<void> {
        return this._client.initApplicationCommands();
    }

    private async initUsernames(): Promise<void> {
        const allModels = await GuildableModel.findAll({
            include: [UsernameModel]
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

    private async populateClosableEvents(): Promise<void> {
        const allModules: CloseableModule<any>[] = DiscordUtils.getCloseableModules();
        for (const module of allModules) {
            await this._dao.transaction(async transaction => {
                for (const [guildId, guild] of this._client.guilds.cache) {
                    const moduleId = module.moduleId;
                    const modelPersisted = await CloseOptionModel.findOne({
                        transaction,
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
                        const m = new CloseOptionModel({
                            transaction,
                            moduleId,
                            guildId
                        });
                        try {
                            await super.commitToDatabase(m, {}, false, transaction);
                        } catch (e) {
                            if (!(e instanceof UniqueViolationError)) {
                                throw e;
                            }
                        }
                    }
                }
            });
        }
    }

    private static async startServer(): Promise<void> {
        const botServer = container.resolve(BotServer);
        await botServer.initClasses();
        botServer.start(4401);
    }

    private async populateGuilds(): Promise<void> {
        const guilds = this._client.guilds.cache;
        return this._dao.transaction(async transaction => {
            for (const [guildId] of guilds) {
                const guild = new GuildableModel({
                    guildId
                });
                try {
                    await super.commitToDatabase(guild, {}, true, transaction);
                } catch (e) {
                    if (!(e instanceof UniqueViolationError)) {
                        throw e;
                    }
                }
            }
        });
    }

    private async populateCommandSecurity(): Promise<void> {
        const securityManager = container.resolve(CommandSecurityManager);
        const allCommands = securityManager.commands;

        async function addNewCommands(this: OnReady, guildModels: GuildableModel[]): Promise<void> {
            await this._dao.transaction(async transaction => {
                const models: {
                    commandName: string, guildId: string
                }[] = [];
                for (const commandCLazz of allCommands) {
                    const {name} = commandCLazz;
                    for (const guildModel of guildModels) {
                        const guildId = guildModel.guildId;
                        const commandSecurity = guildModel.commandSecurityModel;
                        const inArray = ArrayUtils.isValidArray(commandSecurity) && commandSecurity.some(value => value.commandName === name);
                        if (!inArray) {
                            models.push({
                                commandName: name,
                                guildId
                            });
                        }
                    }
                }
                if (models.length > 0) {
                    console.log(`adding commands: ${models.map(value => value.commandName)}`);
                    return CommandSecurityModel.bulkCreate(models, {
                        transaction
                    });
                }
            });
        }

        async function removeOldCommands(this: OnReady, guildModels: GuildableModel[]): Promise<void> {
            await this._dao.transaction(async transaction => {
                for (const guildModel of guildModels) {
                    const {guildId} = guildModel;
                    const commandSecurity = guildModel.commandSecurityModel;
                    const commandsToDestroy: string[] = [];
                    for (const {commandName} of commandSecurity) {
                        const hasInSystem = allCommands.find(command => command.name === commandName);
                        if (!hasInSystem) {
                            console.log(`delete command ${commandName}`);
                            commandsToDestroy.push(commandName);
                        }
                    }
                    if (ArrayUtils.isValidArray(commandsToDestroy)) {
                        await CommandSecurityModel.destroy({
                            transaction,
                            where: {
                                "commandName": commandsToDestroy,
                                guildId
                            }
                        });
                    }
                }
            });
        }

        const guilds = await GuildableModel.findAll({
            include: [CommandSecurityModel]
        });
        await addNewCommands.call(this, guilds);
        await removeOldCommands.call(this, guilds);
    }

    private async populatePostableChannels(): Promise<void> {
        const guildModels = await GuildableModel.findAll({
            include: [CommandSecurityModel]
        });
        const currentModels = await PostableChannelModel.findAll();
        const models: {
            guildId: string
        }[] = [];
        await this._dao.transaction(async transaction => {
            for (const guildModel of guildModels) {
                const guildId = guildModel.guildId;
                if (currentModels.some(m => m.guildId === guildId)) {
                    continue;
                }
                models.push({
                    guildId
                });
            }
            return PostableChannelModel.bulkCreate(models, {
                transaction
            });
        });
    }

    private async cleanUpGuilds(): Promise<void> {
        const guildsJoined = [...this._client.guilds.cache.keys()];
        for (const guildsJoinedId of guildsJoined) {
            const guildModels = await GuildableModel.findOne({
                where: {
                    "guildId": guildsJoinedId
                }
            });
            if (!guildModels) {
                await GuildableModel.destroy({
                    cascade: true,
                    where: {
                        guildId: guildsJoinedId
                    }
                });
            }
        }
    }
}