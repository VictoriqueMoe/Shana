import {GuardFunction} from "@typeit/discord";

export const NotBot: GuardFunction<"message"> = async (
    [message],
    client,
    next
) => {
    if (message.channel.type !== "dm" && !message.author.bot) {
        await next();
        return;
    }
};