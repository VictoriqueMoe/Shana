import {CommandInteraction, DMChannel, Message} from "discord.js";

export async function notBot(message: Message | CommandInteraction): Promise<boolean> {
    return message.channel instanceof DMChannel ? false : !message?.member?.user?.bot;
}
