import {CommandMessage, CommandNotFound, Discord} from "@typeit/discord";
import {Dropbox} from 'dropbox';

const {prefix, dropboxToken} = require('../../config.json');

@Discord(prefix, {
    import: `${__dirname}/../{commands,events}/**/*.ts`
})
export abstract class WeebBot {

    private static dbx: Dropbox;

    private constructor() {
        WeebBot.dbx = new Dropbox({accessToken: dropboxToken});
    }

    @CommandNotFound()
    private notFoundA(command: CommandMessage): void {
        console.log(`invalid ${command.content}`);
    }

    public static get dropBox(): Dropbox {
        return WeebBot.dbx;
    }

}