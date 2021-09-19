import {ArgsOf, GuardFunction, SimpleCommandMessage} from "discordx";
import {notBot} from "../model/decorators/messageListenerDecorator";
import {CommandInteraction} from "discord.js";

export const NotBot: GuardFunction<ArgsOf<"messageCreate">> = async (
    [message],
    client,
    next
) => {
    if (await notBot(message)) {
        await next();
    }
};


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