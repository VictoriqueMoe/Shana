import {Command, CommandMessage, Guard} from "@typeit/discord";
import {DiscordUtils} from "../utils/Utils";
import {TextChannel} from "discord.js";
import {AdminOnlyTask} from "../guards/AdminOnlyTask";
import {BlockGuard} from "../guards/BlockGuard";

export abstract class ChannelTruncator{

    @Command("ChannelTruncator :channel")
    @Guard(AdminOnlyTask, BlockGuard)
    private async channelTruncator(command: CommandMessage): Promise<void> {
       /* let channelNameToWipe = command.args.channel;
        let channel = DiscordUtils.findChannelByName(channelNameToWipe);
        if (channel == null) {
            command.reply("Invalid channel name");
            return;
        }
        if (!(channel instanceof TextChannel)) {
            command.reply("This command only works on test channels");
            return;
        }
        let oldPosition = channel.position;
        let oldDescription = channel.topic;
        let newChannel = await channel.clone();

        await channel.delete("truncation");
        newChannel.setPosition(oldPosition);
        newChannel.setTopic(oldDescription);*/
    }
}