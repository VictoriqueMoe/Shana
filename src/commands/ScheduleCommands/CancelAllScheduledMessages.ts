import {Command, CommandMessage, Guard} from "@typeit/discord";
import {AdminOnlyTask} from "../../guards/AdminOnlyTask";
import {BlockGuard} from "../../guards/BlockGuard";
import {MessageScheduler} from "../../model/MessageScheduler";

export abstract class CancelAllScheduledMessages{

    @Command("cancelAllScheduledMessages")
    @Guard(AdminOnlyTask, BlockGuard)
    private cancelAllScheduledMessages(command: CommandMessage): void {
        MessageScheduler.getInstance().cancelAllJobs();
        command.reply("All scheduled posts have been cancelled");
    }
}