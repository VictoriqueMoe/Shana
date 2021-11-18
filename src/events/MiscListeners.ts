import {ArgsOf, Client, Discord, On} from "discordx";
import {Message, User} from "discord.js";
import {MessageListener} from "../managedEvents/messageEvents/MessageListener";

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
}