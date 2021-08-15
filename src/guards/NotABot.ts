import {Client, Next} from "discordx";
import {notBot} from "../model/decorators/messageListenerDecorator";
import {Message} from "discord.js";

export async function NotBot(message: Message, client: Client, next: Next) {
    if (await notBot(message)) {
        await next();
    }
}

