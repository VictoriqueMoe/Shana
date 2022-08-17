import "reflect-metadata";
import dotenv from "dotenv";
import {Property} from "./model/framework/decorators/Property.js";
import {Client, ClientOptions, DIService, tsyringeDependencyRegistryEngine} from "discordx";
import {container} from "tsyringe";
import {dirname, importx} from "@discordx/importer";
import {DataSource} from "typeorm";
import {Typeings} from "./model/Typeings.js";
import {IntentsBitField} from "discord.js";
import {registerInstance} from "./model/framework/DI/moduleRegistrar.js";
import propTypes = Typeings.propTypes;

dotenv.config();

export class Main {
    @Property("TOKEN")
    private static readonly token: string;

    @Property("NODE_ENV")
    private static readonly envMode: propTypes["NODE_ENV"];

    @Property("TEST_TOKEN", Main.envMode === "development")
    private static readonly testToken: string;

    public static async start(): Promise<void> {
        DIService.engine = tsyringeDependencyRegistryEngine.setInjector(container);
        const testMode = Main.envMode === "development";
        const dbName = testMode ? "database_test.sqlite" : "database.sqlite";

        const datasource = new DataSource({
            type: "better-sqlite3",
            database: dbName,
            synchronize: testMode,
            cache: {
                duration: 1000
            },
            entities: [`${dirname(import.meta.url)}/model/DB/**/*.model.{ts,js}`]
        });

        const connectedDs = await datasource.initialize();
        if (!connectedDs.isInitialized) {
            throw new Error("Unable to initialise database");
        }
        await connectedDs.queryResultCache.clear();
        const clientOps: ClientOptions = {
            intents: [
                IntentsBitField.Flags.Guilds,
                IntentsBitField.Flags.GuildMessages,
                IntentsBitField.Flags.GuildMembers,
                IntentsBitField.Flags.MessageContent,
                IntentsBitField.Flags.GuildBans,
                IntentsBitField.Flags.GuildMessageReactions,
                IntentsBitField.Flags.GuildPresences,
                IntentsBitField.Flags.DirectMessages,
                IntentsBitField.Flags.GuildVoiceStates
            ],
            silent: false,
        };
        if (this.envMode === "development") {
            clientOps["botGuilds"] = [(client: Client): string[] => client.guilds.cache.map((guild) => guild.id)];
        }
        const client = new Client(clientOps);
        registerInstance(connectedDs, client);
        await importx(`${dirname(import.meta.url)}/{events,commands}/**/*.{ts,js}`);
        await client.login(testMode ? this.testToken : this.token);
    }
}

await Main.start();
