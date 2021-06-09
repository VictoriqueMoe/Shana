import {Client} from "@typeit/discord";
import {CloseableModule} from "./model/closeableModules/impl/CloseableModule";
import {Sequelize} from "sequelize-typescript";
import * as dotenv from "dotenv";
import {EnumEx, ObjectUtil} from "./utils/Utils";
import {DEFAULT_SETTINGS, SETTINGS} from "./enums/SETTINGS";
import {SettingsManager} from "./model/settings/SettingsManager";
import * as http from "http";
import * as fs from 'fs';

const io = require('@pm2/io');
io.init({
    transactions: true,// will enable the transaction tracing
    http: true // will enable metrics about the http server (optional)
});
dotenv.config({path: __dirname + '/../.env'});

export class CloseableModuleSet extends Set<CloseableModule<any>> {
    add(value: CloseableModule<any>): this {
        for (const v of this.values()) {
            if (v.uid === value.uid) {
                super.delete(v);
                break;
            }
        }
        super.add(value);
        return this;
    }

    has(value: CloseableModule<any>): boolean {
        for (const v of this.values()) {
            if (v.uid === value.uid) {
                return true;
            }
        }
        return false;
    }

}

export class Main {
    public static closeableModules: CloseableModuleSet = new CloseableModuleSet();

    private static _client: Client;

    public static testMode = false;

    private static _dao: Sequelize;

    public static botServer: http.Server;

    public static get dao(): Sequelize {
        return Main._dao;
    }

    static get client(): Client {
        return this._client;
    }

    public static async start(): Promise<void> {
        console.log(process.execArgv);
        this._client = new Client();
        Main._dao = new Sequelize('database', '', '', {
            host: 'localhost',
            dialect: 'sqlite',
            logging: (sql, timing) => {
                if (Main.testMode) {
                    console.log(sql, timing);
                }
            },
            storage: 'database.sqlite',
            models: [__dirname + '/model/DB/**/*.model.{ts,js}'],
            modelMatch: (filename, member) => {
                return `${filename.substring(0, filename.indexOf('.model'))}Model`.toLowerCase() === member.toLowerCase();
            }
        });
        await Main.dao.sync({force: false});
        this.loadCustomActions();
        await this._client.login(
            process.env.token,
            `${__dirname}/discord/*.ts`,
            `${__dirname}/discord/*.js`,
        );
    }

    private static loadCustomActions(): void {
        io.action('getLogs', async (cb) => {
            const url = `${__dirname}/../logs/combined.log`;
            const log = fs.readFileSync(url, {
                encoding: 'utf8'
            });
            return cb(log);
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

((async () => {
    await Main.start();
})());
