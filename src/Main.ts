import "reflect-metadata";
import dotenv from "dotenv";
import {Property} from "./model/framework/decorators/Property.js";
import {Client, ClientOptions, DIService, tsyringeDependencyRegistryEngine} from "discordx";
import {container} from "tsyringe";
import {dirname, importx} from "@discordx/importer";
import {DataSource} from "typeorm";
import {registerInstance} from "./model/framework/DI/moduleRegistrar.js";
import {Typeings} from "./model/Typeings.js";
import {IntentsBitField} from "discord.js";
import propTypes = Typeings.propTypes;

export class Main {
    @Property("token")
    private static readonly token: string;

    @Property("node_env")
    private static readonly envMode: propTypes["node_env"];

    @Property("test_token", Main.envMode === "development")
    private static readonly testToken: string;

    public static async start(): Promise<void> {
        DIService.engine = tsyringeDependencyRegistryEngine.setInjector(container);
        dotenv.config();
        const testMode = Main.envMode === "development";
        const dbName = testMode ? "database_test.sqlite" : "database.sqlite";

        const datasource = new DataSource({
            type: "better-sqlite3",
            database: dbName,
            synchronize: testMode,
            entities: [`${dirname(import.meta.url)}/model/DB/**/*.model.{ts,js}`]
        });

        const connectedDs = await datasource.initialize();
        const clientOps: ClientOptions = {
            intents: [
                IntentsBitField.Flags.Guilds,
                IntentsBitField.Flags.GuildMessages,
                IntentsBitField.Flags.GuildMembers,
                IntentsBitField.Flags.GuildBans,
                IntentsBitField.Flags.GuildMessageReactions,
                IntentsBitField.Flags.GuildPresences,
                IntentsBitField.Flags.DirectMessages,
                IntentsBitField.Flags.GuildVoiceStates
            ],
            silent: Main.envMode !== "development",
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
