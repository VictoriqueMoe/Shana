import {CommandInteraction, DMChannel, Message} from "discord.js";

export function notBot(message: Message | CommandInteraction): boolean {
    return message.channel instanceof DMChannel ? false : !message?.member?.user?.bot;
}
