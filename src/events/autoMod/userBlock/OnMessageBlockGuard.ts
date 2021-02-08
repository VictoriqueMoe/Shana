import {ArgsOf, Client, Guard, On} from "@typeit/discord";
import {NotBot} from "../../../guards/NotABot";
import {Message} from "discord.js";
import {DiscordUtils} from "../../../utils/Utils";

export abstract class OnMessageBlockGuard {


    @On("message")
    @Guard(NotBot)
    private async onMessageBlockGuard([message]: ArgsOf<"message">, client: Client): Promise<Message | undefined> {
        let mutedModel = await DiscordUtils.getUserBlocked(message);
        if (mutedModel) {
            await message.delete();
            mutedModel = await mutedModel.increment('violationRules');
            let rules = ++mutedModel.violationRules;
            if (rules === 1) {
                let reply = await message.reply(`You have been banned from posting, you attempted to post: ${rules} times`);
                return reply.delete({timeout: 5000});
            }
        }
    }
}