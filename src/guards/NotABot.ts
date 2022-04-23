import type {CommandInteraction, Message} from "discord.js";
import {DMChannel} from "discord.js";

export async function notBot(message: Message | CommandInteraction): Promise<boolean> {
    return message.channel instanceof DMChannel ? false : !message?.member?.user?.bot;
}
