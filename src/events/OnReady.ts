import {On} from "@typeit/discord";
import {Main} from "../Main";
import {Sequelize} from "sequelize-typescript";


export abstract class OnReady {

    private static _dao: Sequelize;

    @On("ready")
    private async initialize(): Promise<void> {
        OnReady._dao = new Sequelize('database', 'username', 'password', {
            host: 'localhost',
            dialect: 'sqlite',
            logging: false,
            storage: 'database.sqlite',
            models: [__dirname + '/../model/DB/**/*.model.ts'],
            modelMatch: (filename, member) => {
                return `${filename.substring(0, filename.indexOf('.model'))}Model`.toLowerCase() === member.toLowerCase();
            }
        });
        await Main.client.user.setActivity('Anime', {type: 'WATCHING'});
        await OnReady._dao.sync({force: false});
        console.log("Bot logged in.");
    }

    public static get dao(): Sequelize {
        return OnReady._dao;
    }
}