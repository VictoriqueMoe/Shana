import {Command, CommandMessage, Guard} from "@typeit/discord";
import {StringUtils} from "../../utils/StringUtils";
import {Scheduler} from "../../model/scheduler";
import {AdminOnlyTask} from "../../guards/AdminOnlyTask";

export abstract class CancelScheduledMessage {

    @Guard(AdminOnlyTask)
    @Command("cancelScheduledMessage")
    private cancelScheduledMessage(command: CommandMessage): void {
        let [name] = StringUtils.splitCommandLine(command.content);
        let didCancel = Scheduler.getInstance().cancelJob(name);
        command.reply(didCancel ? `Job with name "${name}" was cancelled` : `Job with name "${name}" does not exist`);
    }
}