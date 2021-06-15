import {ArgsOf, Client, On} from "@typeit/discord";
import {User} from "discord.js";
import {MessageListener} from "../managedEvents/messageEvents/MessageListener";

export class MiscListeners {
    @On("messageReactionAdd")
    private async scanEmojiReactAdd([reaction, user]: ArgsOf<"messageReactionAdd">, client: Client): Promise<void> {
        const emjiFromReaction = reaction.emoji;
        const emojiId = emjiFromReaction.id;
        if (!(user instanceof User)) {
            try {
                user = (await reaction.message.guild.members.fetch(user.id)).user;
            } catch (e) {
                console.error(e);
                return;
            }
        }
        MessageListener.doEmojiBan([emojiId], user, reaction.message, true);
    }
}