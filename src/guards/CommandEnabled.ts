import {DiscordUtils} from "../utils/Utils";
import {GuardFunction, SimpleCommandMessage} from "discordx";
import {CommandSecurityManager} from "../model/guild/manager/CommandSecurityManager";
import {CommandInteraction, ContextMenuInteraction} from "discord.js";
import {container} from "tsyringe";

export const CommandEnabled: GuardFunction<CommandInteraction | SimpleCommandMessage | ContextMenuInteraction> = async (arg, client, next) => {
    let commandName = "";
    let guildId = "";
    if (arg instanceof SimpleCommandMessage) {
        commandName = arg.name;
    } else {
        if (arg.isContextMenu() || arg.isCommand()) {
            commandName = arg.commandName;
            guildId = arg.guildId;
        }
    }
    const securityManager = container.resolve(CommandSecurityManager);
    const isEnabled = await securityManager.isEnabled(commandName, guildId);
    if (isEnabled) {
        return next();
    }
    if (arg instanceof SimpleCommandMessage) {
        const {message} = arg;
        return message.reply("This command is not enabled");
    } else {
        return DiscordUtils.InteractionUtils.replyOrFollowUp(arg, `This command is not enabled`, true);
    }
};