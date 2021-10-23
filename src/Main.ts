import "reflect-metadata";
import {Sequelize} from "sequelize-typescript";
import * as dotenv from "dotenv";
import {ObjectUtil} from "./utils/Utils";
import * as v8 from "v8";
import {Client, DIService, SimpleCommandMessage} from "discordx";
import {Intents} from "discord.js";
import {moduleRegistrar, registerInstance} from "./DI/moduleRegistrar";
import {container} from "tsyringe";
import {GuildManager} from "./model/guild/manager/GuildManager";
import {SettingsManager} from "./model/settings/SettingsManager";

// const https = require('http-debug').https;
// https.debug = 1;
const io = require('@pm2/io');
io.init({
    transactions: true,// will enable the transaction tracing
    http: true // will enable metrics about the http server (optional)
});
dotenv.config({path: __dirname + '/../.env'});

export class Main {
    public static testMode = true;

    public static async start(): Promise<void> {
        DIService.container = container;
        console.log(process.execArgv);
        console.log(`max heap sapce: ${v8.getHeapStatistics().total_available_size / 1024 / 1024}`);
        await moduleRegistrar();
        const dbName = Main.testMode ? "database_test.sqlite" : "database.sqlite";
        const dao = new Sequelize('database', '', '', {
            host: 'localhost',
            dialect: 'sqlite',
            logging: (sql: string, timing: number): void => {
                if (Main.testMode) {
                    // console.log(sql, timing);
                }
            },
            storage: dbName,
            models: [__dirname + '/model/DB/**/*.model.{ts,js}'],
            modelMatch: (filename, member): boolean => {
                return `${filename.substring(0, filename.indexOf('.model'))}Model`.toLowerCase() === member.toLowerCase();
            }
        });
        await dao.sync({force: false});
        const client = new Client({
            botId: `ShanaBot_${ObjectUtil.guid()}`,
            simpleCommand: {
                prefix: container.resolve(SettingsManager).getPrefix,
                responses: {
                    unauthorised: (command: SimpleCommandMessage): void => {
                        console.log(command);
                    }
                }
            },
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
        registerInstance(dao, client);
        await client.login(Main.testMode ? process.env.test_token : process.env.token);
    }
}

((async (): Promise<void> => {
    await Main.start();
})());
