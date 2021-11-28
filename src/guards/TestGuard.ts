import {GuardFunction} from "discordx";
import {ContextMenuInteraction} from "discord.js";

export const testGuard: GuardFunction<ContextMenuInteraction> = async (arg, client, next) => {
    console.log(`arg is ${arg}`);
    console.log(`ContextMenuInteraction is ${ContextMenuInteraction}`);
    if (arg.isContextMenu()) {
        console.log("this is an interaction");
    }
};