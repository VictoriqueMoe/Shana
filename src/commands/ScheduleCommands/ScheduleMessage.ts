import {Command, CommandMessage, Guard} from "@typeit/discord";
import {ChronException, ChronUtils, DiscordUtils, GuildUtils, StringUtils} from "../../utils/Utils";
import {Scheduler} from "../../model/Scheduler";
import {Main} from "../../Main";
import {TextChannel} from "discord.js";
import {AdminOnlyTask} from "../../guards/AdminOnlyTask";
import {MessageScheduler} from "../../model/MessageScheduler";

export abstract class ScheduleMessage {

    @Guard(AdminOnlyTask)
    @Command("scheduleMessage")
    //TODO: add help description ~help
    private scheduleMessage(command: CommandMessage): void {
        let argumentArray = StringUtils.splitCommandLine(command.content);
        if (argumentArray.length !== 4) {
            command.reply("Arguments invalid, please make sure you supply: Name, Message, Chron and channelID each in quotes");
            return;
        }
        let [name, message, chron, channelName] = StringUtils.splitCommandLine(command.content);
        let channel = DiscordUtils.findChannelByName(channelName);
        if (channel == null) {
            command.reply("Invalid channel name");
            return;
        }
        if (!(channel instanceof TextChannel)) {
            command.reply("This command only works on test channels");
            return;
        }
        try {
            MessageScheduler.getInstance().register(name, chron, () => (channel as TextChannel).send(message), channel);
        } catch (e) {
            if (e instanceof ChronException) {
                command.reply("Chron format is invalid");
                return;
            }
            throw e;
        }

        command.reply(`job "${name}" has been scheduled to post ${ChronUtils.chronToString(chron)} on channel "<#${channel.id}>" \n any jobs with this name have been replaced`);
    }
}