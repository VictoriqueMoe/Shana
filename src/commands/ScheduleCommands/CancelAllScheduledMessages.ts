import {Command, CommandMessage, Guard} from "@typeit/discord";
import {AdminOnlyTask} from "../../guards/AdminOnlyTask";
import {Scheduler} from "../../model/Scheduler";

export abstract class CancelAllScheduledMessages{

    @Command("cancelAllScheduledMessages")
    @Guard(AdminOnlyTask)
    private cancelAllScheduledMessages(command: CommandMessage): void {
        Scheduler.getInstance().cancelAllJobs();
        command.reply("All scheduled posts have been cancelled");
    }
}