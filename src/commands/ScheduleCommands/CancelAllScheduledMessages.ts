import {Command, CommandMessage, Guard} from "@typeit/discord";
import {AdminOnlyTask} from "../../guards/AdminOnlyTask";
import {Scheduler} from "../../model/Scheduler";
import {BlockGuard} from "../../guards/BlockGuard";

export abstract class CancelAllScheduledMessages{

    @Command("cancelAllScheduledMessages")
    @Guard(AdminOnlyTask, BlockGuard)
    private cancelAllScheduledMessages(command: CommandMessage): void {
        Scheduler.getInstance().cancelAllJobs();
        command.reply("All scheduled posts have been cancelled");
    }
}