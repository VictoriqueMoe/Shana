import {Client, Next} from "discordx";
import {notBot} from "../model/decorators/messageListenerDecorator";
import {CommandInteraction, Message} from "discord.js";

export async function NotBot(message: Message | CommandInteraction, client: Client, next: Next): Promise<void> {
    if (await notBot(message)) {
        await next();
    }
}

