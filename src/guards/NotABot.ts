import {ArgsOf, GuardFunction} from "discordx";
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


export const NotBotInteraction: GuardFunction<CommandInteraction> = async (arg, client, next) => {
    if (!arg.member.user.bot) {
        await next();
    }
};