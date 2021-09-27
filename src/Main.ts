import "reflect-metadata";
import {CloseableModule} from "./model/closeableModules/impl/CloseableModule";
import {Sequelize} from "sequelize-typescript";
import * as dotenv from "dotenv";
import {EnumEx, ObjectUtil} from "./utils/Utils";
import {DEFAULT_SETTINGS, SETTINGS} from "./enums/SETTINGS";
import {SettingsManager} from "./model/settings/SettingsManager";
import * as http from "http";
import * as v8 from "v8";
import {Client} from "discordx";
import {Intents, Message} from "discord.js";
import {Dropbox} from "dropbox";
import {Player} from "discord-music-player";
import {GuildableModel} from "./model/DB/guild/Guildable.model";
import {moduleRegistrar} from "./DI/moduleRegistrar";
// const https = require('http-debug').https;
// https.debug = 1;
const io = require('@pm2/io');
io.init({
    transactions: true,// will enable the transaction tracing
    http: true // will enable metrics about the http server (optional)
});
dotenv.config({path: __dirname + '/../.env'});

export class CloseableModuleSet extends Set<CloseableModule<any>> {
    override add(value: CloseableModule<any>): this {
        for (const v of this.values()) {
            if (v.uid === value.uid) {
                super.delete(v);
                break;
            }
        }
        super.add(value);
        return this;
    }

    override has(value: CloseableModule<any>): boolean {
        for (const v of this.values()) {
            if (v.uid === value.uid) {
                return true;
            }
        }
        return false;
    }

}

export async function getPrefix(message: Message): Promise<string> {
    const guildId = message?.guild?.id ?? "~";
    return SettingsManager.instance.getSetting(SETTINGS.PREFIX, guildId);
}

export class Main {
    public static closeableModules: CloseableModuleSet = new CloseableModuleSet();
    public static testMode = false;
    public static interactionTestMode = Main.testMode || true;
    public static botServer: http.Server;
    private static _client: Client;
    private static dbx: Dropbox;
    private static _player: Player;

    static get client(): Client {
        return this._client;
    }

    private static _dao: Sequelize;

    public static get dao(): Sequelize {
        return Main._dao;
    }

    public static get dropBox(): Dropbox {
        return Main.dbx;
    }

    public static get player(): Player {
        return Main._player;
    }

    public static async start(): Promise<void> {
        console.log(process.execArgv);
        console.log(`max heap sapce: ${v8.getHeapStatistics().total_available_size / 1024 / 1024}`);
        moduleRegistrar();
        Main.dbx = new Dropbox({accessToken: process.env.dropboxToken});
        Main._dao = new Sequelize('database', '', '', {
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
        await Main.dao.sync({force: false});
        const guilds = await GuildableModel.findAll();
        const allGuildIds = guilds.map(guild => guild.guildId);
        this._client = new Client({
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
            botGuilds: Main.interactionTestMode ? allGuildIds : undefined,
            silent: false,
        });
        await this._client.login(process.env.token);

    }

    public static initMusicPlayer(): void {
        Main._player = new Player(Main.client, {
            leaveOnEmpty: true,
            quality: "high"
        });
    }

    public static async setDefaultSettings(): Promise<void> {
        const guilds = this.client.guilds;
        const cache = guilds.cache;
        const nameValue = EnumEx.getNamesAndValues(DEFAULT_SETTINGS) as any;
        for (const [guildId] of cache) {
            for (const keyValuesObj of nameValue) {
                const setting: SETTINGS = keyValuesObj.name;
                let value = keyValuesObj.value;
                if (!ObjectUtil.validString(value)) {
                    value = null;
                }
                await SettingsManager.instance.saveOrUpdateSetting(setting, value, guildId, true);
            }
        }
    }
}

((async (): Promise<void> => {
    await Main.start();
})());
