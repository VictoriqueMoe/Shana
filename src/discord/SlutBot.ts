import {CommandMessage, CommandNotFound, Discord} from "@typeit/discord";
import * as Path from "path";

const {prefix} = require('../../config.json');

@Discord(prefix, {
    import: [
        Path.join(__dirname, "..", "commands", "*.ts"),
        Path.join(__dirname, "..",  "events", "*.ts")
    ]
})
export abstract class SlutBot {

    @CommandNotFound()
    notFoundA(command: CommandMessage):void {
        command.reply("Command not found");
    }

}