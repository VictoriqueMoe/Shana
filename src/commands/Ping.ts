import {Command, CommandMessage, Guard} from "@typeit/discord";
import {BlockGuard} from "../guards/BlockGuard";

export abstract class Ping {

    @Command("ping")
    @Guard(BlockGuard)
    private ping(command: CommandMessage): void {
        command.reply(`Websocket heartbeat: ${command.client.ws.ping}ms.`);
    }
}