import "reflect-metadata";
import * as dotenv from "dotenv";
import {ObjectUtil} from "./utils/Utils.js";
import * as v8 from "v8";
import {Client, DIService, SimpleCommandMessage} from "discordx";
import {Intents, Message} from "discord.js";
import {moduleRegistrar, registerInstance} from "./DI/moduleRegistrar.js";
import {container} from "tsyringe";
import {GuildManager} from "./model/guild/manager/GuildManager.js";
import {SettingsManager} from "./model/settings/SettingsManager.js";
import typeorm from "typeorm";
const { createConnection, useContainer } = typeorm;
import io from "@pm2/io";
// const https = require('http-debug').https;
// https.debug = 1;


io.init({
    tracing: true,
    metrics: {
        http: true
    }
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
        useContainer(
            {get: someClass => container.resolve(someClass as any)},
        );
        const connection = await createConnection({
            type: "better-sqlite3",
            database: dbName,
            synchronize: true,
            key: process.env.sqlIte_key,
            entities: [__dirname + '/model/DB/**/*.model.js'],
        });
        const client = new Client({
            botId: `ShanaBot_${ObjectUtil.guid()}`,
            simpleCommand: {
                prefix: async (message: Message): Promise<string> => {
                    const guildId = message?.guild?.id;
                    return container.resolve(SettingsManager).getPrefix(guildId);
                },
                responses: {
                    unauthorised: (command: SimpleCommandMessage): void => {
                        console.log(command);
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
            botGuilds: [async (): Promise<string[]> => {
                const guildManager = container.resolve(GuildManager);
                const guilds = await guildManager.getGuilds();
                return guilds.map(guild => guild.id);
            }],
            silent: false
        });
        //  await importx(`${__dirname}/{commands,events}/**/*.js`);
        registerInstance(connection, client);
        // await client.login(Main.testMode ? process.env.test_token : process.env.token);
    }
}

((async (): Promise<void> => {
    await Main.start();
})());