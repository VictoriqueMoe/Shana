import {Command, CommandMessage, Guard} from "@typeit/discord";
import {StringUtils} from "../../utils/Utils";
import {AdminOnlyTask} from "../../guards/AdminOnlyTask";
import {BlockGuard} from "../../guards/BlockGuard";
import {MessageScheduler} from "../../model/MessageScheduler";

export abstract class CancelScheduledMessage {

    @Command("cancelScheduledMessage")
    @Guard(AdminOnlyTask, BlockGuard)
    private cancelScheduledMessage(command: CommandMessage): void {
        let names = StringUtils.splitCommandLine(command.content);
        for(let name of names){
            MessageScheduler.getInstance().cancelJob(name);
        }

        command.reply( `Job(s) cancelled`);
    }
}