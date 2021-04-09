import {On} from "@typeit/discord";
import {Main} from "../Main";
import {VicDropbox} from "../model/dropbox/VicDropbox";
import {MuteModel} from "../model/DB/autoMod/impl/Mute.model";
import {Op} from "sequelize";
import {ArrayUtils, loadClasses, ObjectUtil} from "../utils/Utils";
import {Guild} from "discord.js";
import {UsernameModel} from "../model/DB/autoMod/impl/Username.model";
import {CloseOptionModel} from "../model/DB/autoMod/impl/CloseOption.model";
import {BaseDAO, UniqueViolationError} from "../DAO/BaseDAO";
import {MuteSingleton} from "../commands/customAutoMod/userBlock/MuteSingleton";
import {BotServer} from "../api/BotServer";
import {GuildableModel} from "../model/DB/guild/Guildable.model";
import {CommandSecurityModel} from "../model/DB/guild/CommandSecurity.model";
import {CommandSecurityManager} from "../model/guild/manager/CommandSecurityManager";

/**
 * TODO: couple this class to appropriate classes
 */
export class OnReady extends BaseDAO<any> {
    private readonly classesToLoad = [`${__dirname}/../model/closeableModules/dynoAutoMod/subModules/impl/*.ts`];

    private static async initiateMuteTimers(): Promise<void> {
        const mutesWithTimers = await MuteModel.findAll({
            where: {
                timeout: {
                    [Op.not]: null
                }
            }
        });
        const now = Date.now();
        for (const mute of mutesWithTimers) {
            const muteCreated = (mute.createdAt as Date).getTime();
            const timerLength = mute.timeout;
            const timeLeft = timerLength - (now - muteCreated);
            const guild: Guild = await Main.client.guilds.fetch(mute.guildId);
            if (timeLeft <= 0) {
                console.log(`Timer has expired for user ${mute.username}, removing from database`);
                await MuteModel.destroy({
                    where: {
                        id: mute.id,
                        guildId: mute.guildId
                    }
                });
            } else {
                console.log(`Re-creating timed mute for ${mute.username}, time reamining is: ${ObjectUtil.secondsToHuman(Math.round(timeLeft / 1000))}`);
                MuteSingleton.instance.createTimeout(mute.userId, mute.username, timeLeft, guild);
            }
        }
    }

    public init(): Promise<any>[] {
        const pArr: Promise<any>[] = [];
        pArr.push(this.populateClosableEvents());
        pArr.push(Main.setDefaultSettings());
        pArr.push(this.populateCommandSecurity());
        return pArr;
    }

    @On("ready")
    private async initialize(): Promise<void> {
        if (Main.testMode) {
            await Main.client.user.setActivity("Under development", {type: "LISTENING"});
            await Main.client.user.setPresence({
                status: "idle"
            });
        } else {
            await Main.client.user.setActivity('Portal 2', {type: 'PLAYING'});
        }
        const pArr: Promise<any>[] = [];
        await this.populateGuilds();
        pArr.push(VicDropbox.instance.index());
        pArr.push(OnReady.initiateMuteTimers());
        pArr.push(this.initUsernames());
        pArr.push(...this.init());
        pArr.push(loadClasses(...this.classesToLoad));
        pArr.push(this.startServer());
        return Promise.all(pArr).then(() => {
            console.log("Bot logged in.");
        });
    }

    private async initUsernames(): Promise<void> {
        const allModels = await GuildableModel.findAll({
            include: [UsernameModel]
        });
        const pArr: Promise<void>[] = [];
        for (const model of allModels) {
            const guild = await Main.client.guilds.fetch(model.guildId);
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
        const allModules = Main.closeableModules;
        for (const module of allModules) {
            await Main.dao.transaction(async t => {
                for (const [guildId] of Main.client.guilds.cache) {
                    const moduleId = module.moduleId;
                    const modelPercisted = await CloseOptionModel.findOne({
                        where: {
                            moduleId,
                            guildId
                        }
                    });
                    if (modelPercisted) {
                        if (modelPercisted.status) {
                            const moduleName = ObjectUtil.validString(module.constructor.name) ? module.constructor.name : "";
                            console.log(`Module: ${modelPercisted.moduleId} (${moduleName}) enabled`);
                        }
                    } else {
                        const m = new CloseOptionModel({
                            moduleId,
                            guildId
                        });
                        try {
                            await super.commitToDatabase(m);
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

    private async startServer(): Promise<void> {
        const server = await BotServer.getInstance();
        const startServer = server.start(4401);
        Main.botServer = startServer;
    }

    private async populateGuilds(): Promise<void> {
        const guilds = Main.client.guilds.cache;
        return Main.dao.transaction(async t => {
            for (const [guildId] of guilds) {
                const guild = new GuildableModel({
                    guildId
                });
                try {
                    await super.commitToDatabase(guild, {}, true);
                } catch (e) {
                    if (!(e instanceof UniqueViolationError)) {
                        throw e;
                    }
                }
            }
        });
    }

    private async populateCommandSecurity(): Promise<void> {
        const guildModels = await GuildableModel.findAll({
            include: [CommandSecurityModel]
        });
        for (const guildModel of guildModels) {
            const guildId = guildModel.guildId;
            const commandSecurity = guildModel.commandSecurityModel;
            const allCommands = CommandSecurityManager.instance.runnableCommands;
            await Main.dao.transaction(async t => {
                const models: {
                    commandName: string, guildId: string
                }[] = [];
                for (const commandCLazz of allCommands) {
                    const {commands} = commandCLazz.commandDescriptors;
                    for (const commandDescriptor of commands) {
                        const {name} = commandDescriptor;
                        const inArray = ArrayUtils.isValidArray(commandSecurity) && commandSecurity.some(value => value.commandName === name);
                        if (!inArray) {
                            models.push({
                                commandName: name,
                                guildId
                            });
                        }
                    }
                }
                return CommandSecurityModel.bulkCreate(models);
            });
        }
    }
}