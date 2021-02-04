import {CommandMessage, CommandNotFound, Discord} from "@typeit/discord";
import * as Path from "path";
const {prefix} = require('../../config.json');

@Discord(prefix, {
    //TODO: make dynamic
    import: [
        Path.join(__dirname, "..", "commands", "*.ts"),
        Path.join(__dirname, "..",  "commands", "ScheduleCommands" ,"*.ts"),
        Path.join(__dirname, "..",  "events", "*.ts")
    ]
})
export abstract class WeebBot {

    @CommandNotFound()
    private notFoundA(command: CommandMessage):void {
        command.reply("Command not found");
    }

}