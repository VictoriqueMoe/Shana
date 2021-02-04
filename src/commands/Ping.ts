import {Command, CommandMessage} from "@typeit/discord";

export abstract class Ping {

    @Command("ping")
    public ping(command: CommandMessage): void {
        command.reply(`Websocket heartbeat: ${command.client.ws.ping}ms.`);
    }
}