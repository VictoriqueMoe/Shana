import {ArgsOf, Client, Guard, On} from "@typeit/discord";
import {NotBot} from "../../../guards/NotABot";
import {Message} from "discord.js";
import {DiscordUtils} from "../../../utils/Utils";

export abstract class OnMessageBlockGuard{


    @On("message")
    @Guard(NotBot)
    private async onMessageBlockGuard([message]: ArgsOf<"message">, client: Client): Promise<Message> {
        let mutedModel = await DiscordUtils.getUserBlocked(message);
        if(mutedModel){
            mutedModel = await mutedModel.increment('violationRules');
            await message.delete();
            let reply = await message.reply(`You have been banned from posting, you attempted to post: ${++mutedModel.violationRules} times`);
            return reply.delete({ timeout: 5000 });
        }
    }
}