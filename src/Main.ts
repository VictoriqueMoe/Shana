import "reflect-metadata";
import * as dotenv from "dotenv";
import {ObjectUtil} from "./utils/Utils";
import * as v8 from "v8";
import type {SimpleCommandMessage} from "discordx";
import {Client, DIService} from "discordx";
import type {Message} from "discord.js";
import {Intents} from "discord.js";
import {container, instanceCachingFactory} from "tsyringe";
import {GuildManager} from "./model/framework/manager/GuildManager";
import {SettingsManager} from "./model/framework/manager/SettingsManager";
import {ConnectionManager, createConnection, useContainer} from "typeorm";
import io from "@pm2/io";
import {importx} from "@discordx/importer";
import {Settings} from "luxon";
import {Property} from "./model/decorators/Property";
import {moduleRegistrar, registerInstance} from "./DI/moduleRegistrar";
// const https = require('http-debug').https;
// https.debug = 1;

class Main {

    private constructor() {
    }

    @Property("test_mode", false)
    private static testMode = false;

    @Property("token")
    private static readonly token: string;

    @Property("name")
    private static readonly botName: string;

    @Property("test_token", Main.testMode)
    private static readonly testToken: string;

    public static async start(): Promise<void> {
        console.log(`starting ${this.botName}`);
        Settings.defaultZone = "utc";
        Settings.defaultLocale = "en-gb";
        console.log(process.execArgv);
        console.log(`max heap sapce: ${v8.getHeapStatistics().total_available_size / 1024 / 1024}`);
        await moduleRegistrar();
        const dbName = Main.testMode ? "database_test.sqlite" : "database.sqlite";
        useContainer(
            {get: someClass => container.resolve(someClass as any)},
        );
        const connection = await createConnection({
            type: "better-sqlite3",
            database: dbName,
            synchronize: Main.testMode,
            entities: [__dirname + '/model/DB/**/*.model.{ts,js}']
        });
        const client = new Client({
            botId: `ShanaBot_${ObjectUtil.guid()}`,
            simpleCommand: {
                prefix: async (message: Message): Promise<string> => container.resolve(SettingsManager).getPrefix(message?.guildId),
                responses: {
                    unauthorized: (command: SimpleCommandMessage): void => {
                        console.warn(command);
                    }
                }
            },
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
            silent: false,
            botGuilds: [async (): Promise<string[]> => {
                const guildManager = container.resolve(GuildManager);
                const guilds = await guildManager.getGuilds();
                return guilds.map(guild => guild.id);
            }]
        });
        await importx(`${__dirname}/{commands,events}/**/*.{ts,js}`);
        registerInstance(connection, client);
        await client.login(Main.testMode ? this.testToken : this.token);
    }
}

((async (): Promise<void> => {
    io.init({
        tracing: true,
        metrics: {
            http: true
        }
    });
    container.register<ConnectionManager>(ConnectionManager, {
        useFactory: instanceCachingFactory(() => new ConnectionManager())
    });
    dotenv.config({path: __dirname + '/../.env'});
    DIService.container = container;
    await Main.start();
})());
