import {Server} from "@overnightjs/core";
import {Main} from "../Main";
import * as bodyParser from 'body-parser';
import * as path from "path";
import {glob} from "glob";
import {baseController} from "./controllers/BaseController";
import PromiseRouter from "express-promise-router";
import * as http from "http";
import Logger from "jet-logger";

export class BotServer extends Server {

    private static _instance: BotServer;

    private readonly classesToLoad = `${__dirname}/controllers/**/*.{ts,js}`;

    private controllers: baseController[];

    constructor() {
        super(Main.testMode);
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({extended: true}));
    }

    public static async getInstance(): Promise<BotServer> {
        if (!BotServer._instance) {
            BotServer._instance = new BotServer();
            await BotServer._instance.loadClasses();
        }
        return BotServer._instance;
    }

    public addController(controller: baseController): void {
        super.addControllers(controller, PromiseRouter);
    }

    public start(port: number): http.Server {
        return this.app.listen(port, () => {
            Logger.Imp('Server listening on port: ' + port);
        });
    }

    private _isClass(v: any): boolean {
        return typeof v === 'function' && /^\s*class\s+/.test(v.toString());
    }

    private loadClasses(): Promise<void> {
        const files = glob.sync(this.classesToLoad) || [];
        const pArr = files.map(filePath => import(path.resolve(filePath)));
        return Promise.all(pArr).then(modules => {
            for (const module of modules) {
                Logger.Imp(`load ${Object.keys(module)[0]}`);
            }

            /*const instances: AbstractController[] = [];
            for (const module of modules) {
                for (const clazzProp in module) {
                    if (!module.hasOwnProperty(clazzProp)) {
                        continue;
                    }
                    const clazz = module[clazzProp];
                    if (!this._isClass(clazz)) {
                        continue;
                    }
                    const instance = new clazz();
                    if (instance instanceof AbstractController) {
                        instances.push(instance);
                    }
                }
            }
            super.addControllers(instances, PromiseRouter);*/
        });
    }
}