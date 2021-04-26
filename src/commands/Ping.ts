import {Command, CommandMessage, Guard} from "@typeit/discord";
import {AbstractCommand} from "./AbstractCommand";
import {secureCommand} from "../guards/RoleConstraint";

export abstract class Ping extends AbstractCommand<any> {

    constructor() {
        super({
            module:{
                name:"Ping",
                description: "Commands to check the status and health of this bot"
            },
            commands: [
                {
                    name: "ping",
                    description: {
                        text: "Get the websocket heartbeat of the bot"
                    }
                }
            ]
        });
    }

    @Command("ping")
    @Guard(secureCommand)
    private ping(command: CommandMessage): void {
        command.reply(`Websocket heartbeat: ${command.client.ws.ping}ms.`);
    }
}