import {ArgsOf, GuardFunction} from "discordx";
import {notBot} from "../model/decorators/messageListenerDecorator";

export const NotBot: GuardFunction<ArgsOf<"message">> = async ([message], client, next) => {
    if (await notBot(message)) {
        await next();
    }
};
