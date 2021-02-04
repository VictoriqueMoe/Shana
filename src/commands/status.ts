import {Command, CommandMessage} from "@typeit/discord";

export abstract class Status {
    private isEnabled = false;

    @Command("ping")
    public ping(command: CommandMessage): void {
        console.log(`user: ${command.author.username} Enquired about the toy status`);
        command.channel.send(this.isEnabled ? "My vibrator is enabled!" : "My vibrator is disabled!");
    }
}