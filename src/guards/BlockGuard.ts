import {ArgsOf, GuardFunction} from "discordx";
import {DiscordUtils} from "../utils/Utils";

export const BlockGuard: GuardFunction<ArgsOf<"message">> = async (
    [message],
    client,
    next
) => {
    if (await DiscordUtils.getUserBlocked(message) == null) {
        await next();
        return;
    }
};