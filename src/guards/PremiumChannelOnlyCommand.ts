import {GuardFunction} from "@typeit/discord";
import {TextChannel} from "discord.js";

export const PremiumChannelOnlyCommand: GuardFunction<"message"> = async (
    [message],
    client,
    next
) => {
    let channel = message.channel;
    if (!(channel instanceof TextChannel)) {
        return;
    }
    let cat = channel.parent;
    if (cat.id === "769353703761117194") {
        return await next();
    }
};