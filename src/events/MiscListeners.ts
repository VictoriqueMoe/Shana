import {ArgsOf, Client, Discord, On} from "discordx";
import {Message, User} from "discord.js";
import {MessageListener} from "../managedEvents/messageEvents/MessageListener";
import {DiscordUtils} from "../utils/Utils";

@Discord()
export class MiscListeners {
    @On("messageReactionAdd")
    private async scanEmojiReactAdd([reaction, user]: ArgsOf<"messageReactionAdd">, client: Client): Promise<void> {
        const emjiFromReaction = reaction.emoji;
        const emojiId = emjiFromReaction.id;
        if (!(user instanceof User)) {
            try {
                user = (await reaction.message.guild.members.fetch({
                    force: true,
                    user: user.id
                })).user;
            } catch (e) {
                console.error(e);
                return;
            }
        }
        let message = reaction.message;
        if (message.partial) {
            message = await message.fetch();
        }
        MessageListener.doEmojiBan([emojiId], user, message as Message, true);
    }

    @On("rateLimit")
    private async rateLimit([rateLimitData]: ArgsOf<"rateLimit">, client: Client): Promise<void> {
        console.warn(rateLimitData);
    }

    @On("threadCreate")
    private async threadCreate([thread]: ArgsOf<"threadCreate">, client: Client): Promise<void> {
        if (!thread.joinable && !thread.joined) {
            await DiscordUtils.postToLog(`Unable to join created thread: "${thread.name}"`, thread.guildId);
            return;
        }
        try {
            await thread.join();
        } catch (e) {
            console.error(e);
            await DiscordUtils.postToLog(`Unable to join created thread: "${thread.name}"`, thread.guildId);
            return;
        }
        await DiscordUtils.postToLog(`joined thread: "${thread.name}"`, thread.guildId);
    }
}
