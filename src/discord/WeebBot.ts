import {CommandMessage, CommandNotFound, Discord} from "@typeit/discord";
import * as Path from "path";

const {prefix, dropboxToken} = require('../../config.json');
import {Dropbox} from 'dropbox';

@Discord(prefix, {
    //TODO: make dynamic
    import: [
        Path.join(__dirname, "..", "commands", "*.ts"),
        Path.join(__dirname, "..", "commands", "ScheduleCommands", "*.ts"),
        Path.join(__dirname, "..", "commands", "Tags", "*.ts"),
        Path.join(__dirname, "..", "events", "*.ts")
    ]
})
export abstract class WeebBot {

    private static dbx: Dropbox;

    private constructor() {
        WeebBot.dbx = new Dropbox({accessToken: dropboxToken});
    }

    @CommandNotFound()
    private notFoundA(command: CommandMessage): void {
    }

    public static get dropBox(): Dropbox {
        return WeebBot.dbx;
    }

}