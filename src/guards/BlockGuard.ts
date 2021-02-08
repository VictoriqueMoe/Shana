import {GuardFunction} from "@typeit/discord";
import {DiscordUtils, GuildUtils} from "../utils/Utils";

export const BlockGuard: GuardFunction<"message"> = async (
    [message],
    client,
    next
) => {
    if(await DiscordUtils.getUserBlocked(message) == null){
        await next();
        return;
    }
};