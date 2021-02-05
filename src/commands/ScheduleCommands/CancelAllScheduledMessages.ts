import {Command, CommandMessage, Guard} from "@typeit/discord";
import {AdminOnlyTask} from "../../guards/AdminOnlyTask";
import {Scheduler} from "../../model/Scheduler";

export abstract class CancelAllScheduledMessages{
    @Guard(AdminOnlyTask)
    @Command("cancelAllScheduledMessages")
    private cancelAllScheduledMessages(command: CommandMessage): void {
        Scheduler.getInstance().cancelAllJobs();
        command.reply("All scheduled posts have been cancelled");
    }
}