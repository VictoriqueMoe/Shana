import {Command, CommandMessage, Guard} from "@typeit/discord";
import {StringUtils} from "../../utils/Utils";
import {Scheduler} from "../../model/Scheduler";
import {AdminOnlyTask} from "../../guards/AdminOnlyTask";
import {BlockGuard} from "../../guards/BlockGuard";

export abstract class CancelScheduledMessage {

    @Command("cancelScheduledMessage")
    @Guard(AdminOnlyTask, BlockGuard)
    private cancelScheduledMessage(command: CommandMessage): void {
        let names = StringUtils.splitCommandLine(command.content);
        for(let name of names){
            Scheduler.getInstance().cancelJob(name);
        }

        command.reply( `Job(s) cancelled`);
    }
}