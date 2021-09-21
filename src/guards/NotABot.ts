import {GuardFunction, SimpleCommandMessage} from "discordx";
import {CommandInteraction, DMChannel, Message} from "discord.js";

export const NotBotInteraction: GuardFunction<CommandInteraction | SimpleCommandMessage> = async (arg, client, next) => {
    if (arg instanceof SimpleCommandMessage) {
        if (await notBot(arg.message)) {
            await next();
        }
    }
    if (arg instanceof CommandInteraction) {
        if (!arg.member.user.bot) {
            await next();
        }
    }
};

export async function notBot(message: Message | CommandInteraction): Promise<boolean> {
    return message.channel instanceof DMChannel ? false : !message?.member?.user?.bot;
}