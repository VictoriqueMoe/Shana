import {Client, CommandMessage, CommandNotFound, Discord} from "@typeit/discord";
import {Dropbox} from 'dropbox';
import {Message} from "discord.js";
import {SettingsManager} from "../model/settings/SettingsManager";
import {SETTINGS} from "../enums/SETTINGS";

export async function getPrefix(message: Message | string, client?: Client) {
    let guildId = "~";
    try{
        if(typeof message === "string"){
            guildId = message;
        }else{
            guildId = message.guild.id;
        }
    }catch (e){
        console.error(e);
    }
    return SettingsManager.instance.getSetting(SETTINGS.PREFIX, guildId);
}

@Discord(getPrefix, {
    import: `${__dirname}/../{commands,events}/**/*.ts`
})
export abstract class WeebBot {

    private static dbx: Dropbox;

    private constructor() {
        WeebBot.dbx = new Dropbox({accessToken: process.env.dropboxToken});
    }

    @CommandNotFound()
    private notFoundA(command: CommandMessage): void {
        console.log(`invalid ${command.content}`);
    }

    public static get dropBox(): Dropbox {
        return WeebBot.dbx;
    }

}