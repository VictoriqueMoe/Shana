import {DiscordUtils, ObjectUtil} from "../utils/Utils";
import {GuardFunction, SimpleCommandMessage} from "discordx";
import {CommandSecurityManager} from "../model/guild/manager/CommandSecurityManager";
import {getPrefix} from "../Main";
import {CommandInteraction, GuildMember} from "discord.js";
import {container} from "tsyringe";

export const secureCommandInteraction: GuardFunction<CommandInteraction | SimpleCommandMessage> = async (arg, client, next) => {
    let commandName = "";
    let member: GuildMember = null;
    let guildId = "";
    if (arg instanceof CommandInteraction) {
        try {
            commandName = arg.options.getSubcommand(true);
        } catch {
            commandName = arg.commandName;
        }
        if (arg.member instanceof GuildMember) {
            member = arg.member;
        }
        guildId = arg.guildId;
    } else {
        const message = arg.message;
        const prefix = await getPrefix(message);
        commandName = message.content.split(prefix)[1].split(" ")[0];
        member = message.member;
        guildId = message.guildId;
    }
    if (!ObjectUtil.validString(commandName) || !ObjectUtil.validString(guildId) || !member) {
        if (arg instanceof CommandInteraction) {
            return DiscordUtils.InteractionUtils.replyWithText(arg, "Unable to execute command", false);
        }
        return;
    }
    const securityManager = container.resolve(CommandSecurityManager);
    const canRun = await securityManager.canRunCommand(member, commandName);
    const isEnabled = await securityManager.isEnabled(commandName, guildId);
    if (canRun && isEnabled) {
        return next();
    }
    if (arg instanceof CommandInteraction) {
        return DiscordUtils.InteractionUtils.replyWithText(arg, "you do not have permissions to use this command", false);
    } else {
        const message = arg.message;
        message.reply("you do not have permissions to use this command");
    }
};