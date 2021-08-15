import {Client, Next} from "discordx";
import {DiscordUtils} from "../utils/Utils";
import {Message} from "discord.js";

export async function BlockGuard(message: Message, client: Client, next: Next) {
    if (await DiscordUtils.getUserBlocked(message) == null) {
        await next();
        return;
    }
}