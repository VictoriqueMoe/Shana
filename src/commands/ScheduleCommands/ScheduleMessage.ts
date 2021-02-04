import {Command, CommandMessage, Guard} from "@typeit/discord";
import {StringUtils} from "../../utils/StringUtils";
import {Scheduler} from "../../model/scheduler";
import {Main} from "../../Main";
import {GuildUtils} from "../../utils/GuildUtils";
import {TextChannel} from "discord.js";
import {ChronException} from "../../utils/ChronException";
import {AdminOnlyTask} from "../../guards/AdminOnlyTask";

export abstract class ScheduleMessage {

    @Guard(AdminOnlyTask)
    @Command("scheduleMessage")
    //TODO: add help description ~help
    private scheduleMessage(command: CommandMessage): void {
        let argumentArray = StringUtils.splitCommandLine(command.content);
        if(argumentArray.length !== 4){
            command.reply("Arguments invalid, please make sure you supply: Name, Message, Chron and channelID each in quotes");
            return;
        }
        //TODO: change channelID to more human friendly like channel name or something
        let [name, message, chron, channelID] = StringUtils.splitCommandLine(command.content);
        try {
            Scheduler.getInstance().register(name, chron, () => {
                let memeChannel = Main.client.guilds.cache.get(GuildUtils.getGuildID()).channels.cache.get(channelID) as TextChannel;
                memeChannel.send(message);
            });
        } catch (e) {
            if (e instanceof ChronException) {
                command.reply("Chron format is invalid");
                return;
            }
            throw e;
        }

        command.reply(`job ${name} has been scheduled to post according to the chron ${chron} \n any jobs with this name have been replaced`);
    }
}