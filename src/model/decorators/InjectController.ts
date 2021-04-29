import {baseController} from "../../api/controllers/BaseController";
import {BotServer} from "../../api/BotServer";

export function InjectController<T extends typeof baseController>(constructor: T) {

    // @ts-ignore
    const instance: baseController = new constructor();
    // @ts-ignore
    const botInstance = BotServer._instance;

    botInstance.addController(instance);
}