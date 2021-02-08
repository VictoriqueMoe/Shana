import {Command, CommandMessage, Guard} from "@typeit/discord";
import {PremiumChannelOnlyCommand} from "../guards/PremiumChannelOnlyCommand";
import {BlockGuard} from "../guards/BlockGuard";

export abstract class Status {
    private isEnabled = false;

    @Command("status")
    @Guard(PremiumChannelOnlyCommand, BlockGuard)
    private status(command: CommandMessage): void {
        console.log(`user: ${command.author.username} Enquired about the toy status`);
        command.channel.send(this.isEnabled ? "My vibrator is enabled!" : "My vibrator is disabled!");
    }
}