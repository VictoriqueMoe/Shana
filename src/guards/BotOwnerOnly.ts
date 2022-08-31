import {CommandInteraction} from "discord.js";
import {DiscordUtils} from "../utils/Utils.js";
import {Client, Next} from "discordx";
import InteractionUtils = DiscordUtils.InteractionUtils;

export function BotOwnerOnly(arg: CommandInteraction, client: Client, next: Next): Promise<unknown> {
    const userId = arg?.user?.id;
    if (userId !== "697417252320051291") {
        return InteractionUtils.replyOrFollowUp(arg, "unauthorised");
    }
    return next();
}
