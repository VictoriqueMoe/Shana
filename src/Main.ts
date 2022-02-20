import "reflect-metadata";
import * as dotenv from "dotenv";
import {ObjectUtil, getDatabaseConfig} from "./utils/Utils";
import * as v8 from "v8";
import {Client, DIService, SimpleCommandMessage} from "discordx";
import {Intents, Message} from "discord.js";
import {moduleRegistrar, registerInstance} from "./DI/moduleRegistrar";
import {container} from "tsyringe";
import {GuildManager} from "./model/guild/manager/GuildManager";
import {SettingsManager} from "./model/settings/SettingsManager";
import {createConnection, useContainer} from "typeorm";
import io from "@pm2/io";
import {importx} from "@discordx/importer";
import {Settings} from "luxon";
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
    static testMode: boolean;

    public static async start(): Promise<void> {
        this.testMode = process.env.test_mode === 'true';
        Settings.defaultZone = process.env.timezone_defaultZone;
        Settings.defaultLocale = process.env.defaultLocale;
        DIService.container = container;
        console.log(process.execArgv);
        console.log(`max heap sapce: ${v8.getHeapStatistics().total_available_size / 1024 / 1024}`);
        await moduleRegistrar();
        useContainer(
            {get: someClass => container.resolve(someClass as any)},
        );
        const connection = await createConnection(getDatabaseConfig(process.env));
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
        await client.login(process.env.test_mode ? process.env.test_token : process.env.token);
    }
}

((async (): Promise<void> => {
    await Main.start();
})());