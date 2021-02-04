import {Command, CommandMessage, Guard} from "@typeit/discord";
import {Roles} from "../enums/Roles";
import {AdminOnlyTask} from "../guards/AdminOnlyTask";

export class Test{

    @Command("test")
    @Guard(AdminOnlyTask)
    private test(command: CommandMessage): void {
        command.reply("it works!");
    }
}