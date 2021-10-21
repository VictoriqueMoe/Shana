import {DiscordUtils, ObjectUtil} from "../utils/Utils";
import {GuardFunction, SimpleCommandMessage} from "discordx";
import {CommandSecurityManager} from "../model/guild/manager/CommandSecurityManager";
import {CommandInteraction, ContextMenuInteraction} from "discord.js";
import {container} from "tsyringe";

export const secureCommandInteraction: GuardFunction<CommandInteraction | SimpleCommandMessage | ContextMenuInteraction> = async (arg, client, next) => {
    let commandName = "";
    let guildId = "";
    if (arg instanceof SimpleCommandMessage) {
        commandName = arg.name;
    } else {
        if (arg.isContextMenu() || arg.isCommand()) {
            try {
                commandName = arg.options.getSubcommand(true);
            } catch {
                commandName = arg.commandName;
            }
            guildId = arg.guildId;
        }
    }
    const securityManager = container.resolve(CommandSecurityManager);
    const isEnabled = await securityManager.isEnabled(commandName, guildId);
    if (arg instanceof SimpleCommandMessage) {
        const message = arg.message;
        const member = message.member;
        const guildId = message.guildId;
        if (!ObjectUtil.validString(commandName) || !ObjectUtil.validString(guildId) || !member) {
            return;
        }
        const canRun = await securityManager.canRunCommand(member, commandName);
        if (canRun && isEnabled) {
            return next();
        }
        return message.reply("you do not have permissions to use this command");
    } else {
        if (isEnabled) {
            return next();
        }
        return DiscordUtils.InteractionUtils.replyOrFollowUp(arg, `you do not have permissions to the command: "${commandName}"`, false);
    }
};