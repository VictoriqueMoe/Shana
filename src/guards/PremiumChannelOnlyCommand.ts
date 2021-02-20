import {GuardFunction} from "@typeit/discord";
import {TextChannel} from "discord.js";

export const PremiumChannelOnlyCommand: GuardFunction<"message"> = async (
    [message],
    client,
    next
) => {
    const channel = message.channel;
    if (!(channel instanceof TextChannel)) {
        return;
    }
    const cat = channel.parent;
    if (cat.id === "769353703761117194") {
        return await next();
    }
};