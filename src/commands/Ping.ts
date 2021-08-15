import {CommandMessage, Discord, Guard, SimpleCommand} from "discordx";
import {secureCommand} from "../guards/RoleConstraint";
import {AbstractCommandModule} from "./AbstractCommandModule";

@Discord()
export abstract class Ping extends AbstractCommandModule<any> {

    constructor() {
        super({
            module: {
                name: "Ping",
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

    @SimpleCommand("ping")
    @Guard(secureCommand)
    private ping(command: CommandMessage): void {
        command.reply(`Websocket heartbeat: ${command.client.ws.ping}ms.`);
    }
}