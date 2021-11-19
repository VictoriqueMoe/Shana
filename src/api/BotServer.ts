import {Server} from "@overnightjs/core";
import {Main} from "../Main";
import * as bodyParser from 'body-parser';
import * as path from "path";
import {glob} from "glob";
import * as http from "http";
import Logger from "jet-logger";
import {singleton} from "tsyringe";
import {BotController} from "./controllers/impl/BotController";
import {PostConstruct} from "../model/decorators/PostConstruct";

@singleton()
export class BotServer extends Server {

    private readonly classesToLoad = `${__dirname}/controllers/**/*.{ts,js}`;

    constructor(initRouter: BotController) {
        super(Main.testMode);
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({extended: true}));
        super.addControllers(initRouter);
    }

    public start(port: number): http.Server {
        return this.app.listen(port, () => {
            Logger.Imp('Server listening on port: ' + port);
        });
    }

    @PostConstruct
    private loadClasses(): Promise<void> {
        const files = glob.sync(this.classesToLoad) || [];
        const pArr = files.map(filePath => {
            import(path.resolve(filePath)).then(module => {
                Logger.Imp(`load ${Object.keys(module)[0]}`);
            });
        });
        return Promise.all(pArr).then(() => {
            this.start(4401);
        });
    }
}