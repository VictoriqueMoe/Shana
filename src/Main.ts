import "reflect-metadata";
import {Sequelize} from "sequelize-typescript";
import * as dotenv from "dotenv";
import {EnumEx, ObjectUtil} from "./utils/Utils";
import {DEFAULT_SETTINGS, SETTINGS} from "./enums/SETTINGS";
import {SettingsManager} from "./model/settings/SettingsManager";
import * as v8 from "v8";
import {Client, DIService} from "discordx";
import {Intents, Message} from "discord.js";
import {Dropbox} from "dropbox";
import {Player} from "discord-music-player";
import {moduleRegistrar, registerInstance} from "./DI/moduleRegistrar";
import {container} from "tsyringe";
import {GuildManager} from "./model/guild/manager/GuildManager";
// const https = require('http-debug').https;
// https.debug = 1;
const io = require('@pm2/io');
io.init({
    transactions: true,// will enable the transaction tracing
    http: true // will enable metrics about the http server (optional)
});
dotenv.config({path: __dirname + '/../.env'});

export async function getPrefix(message: Message): Promise<string> {
    const guildId = message?.guild?.id;
    if (!ObjectUtil.validString(guildId)) {
        return "~";
    }
    const settingsManager = container.resolve(SettingsManager);
    return settingsManager.getSetting(SETTINGS.PREFIX, guildId);
}

export class Main {
    public static testMode = false;

    public static async start(): Promise<void> {
        console.log(process.execArgv);
        console.log(`max heap sapce: ${v8.getHeapStatistics().total_available_size / 1024 / 1024}`);
        DIService.container = container;
        await moduleRegistrar();
        const dropBox = new Dropbox({accessToken: process.env.dropboxToken});
        const dao = new Sequelize('database', '', '', {
            host: 'localhost',
            dialect: 'sqlite',
            logging: (sql: string, timing: number): void => {
                if (Main.testMode) {
                    // console.log(sql, timing);
                }
            },
            storage: 'database.sqlite',
            models: [__dirname + '/model/DB/**/*.model.{ts,js}'],
            modelMatch: (filename, member): boolean => {
                return `${filename.substring(0, filename.indexOf('.model'))}Model`.toLowerCase() === member.toLowerCase();
            }
        });
        await dao.sync({force: false});
        const client = new Client({
            botId: `ShanaBot_${ObjectUtil.guid()}`,
            prefix: getPrefix,
            classes: [
                `${__dirname}/{commands,events}/**/*.{ts,js}`
            ],
            intents: [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MEMBERS,
                Intents.FLAGS.GUILD_BANS,
                Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
                Intents.FLAGS.GUILD_PRESENCES,
                Intents.FLAGS.DIRECT_MESSAGES,
                Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
                Intents.FLAGS.GUILD_VOICE_STATES
            ],
            botGuilds: [async (): Promise<string[]> => {
                const guildManager = container.resolve(GuildManager);
                const guilds = await guildManager.getGuilds();
                return guilds.map(guild => guild.id);
            }],
            silent: false,
        });
        registerInstance(dropBox, dao, client);
        await client.login(process.env.token);

    }

    public static initMusicPlayer(): void {
        const client = container.resolve(Client);
        const player = new Player(client, {
            leaveOnEmpty: true,
            quality: "high"
        });
        registerInstance(player);
    }

    public static async setDefaultSettings(): Promise<void> {
        const client = container.resolve(Client);
        const guilds = client.guilds;
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
}

((async (): Promise<void> => {
    await Main.start();
})());
