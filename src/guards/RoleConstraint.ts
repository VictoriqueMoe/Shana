import {DiscordUtils, ObjectUtil} from "../utils/Utils";
import {GuardFunction, SimpleCommandMessage} from "discordx";
import {CommandSecurityManager} from "../model/guild/manager/CommandSecurityManager";
import {CommandInteraction, ContextMenuInteraction, GuildMember} from "discord.js";
import {container} from "tsyringe";

export const secureCommandInteraction: GuardFunction<CommandInteraction | SimpleCommandMessage | ContextMenuInteraction> = async (arg, client, next) => {
    let commandName = "";
    let member: GuildMember = null;
    let guildId = "";
    if (arg instanceof SimpleCommandMessage) {
        const message = arg.message;
        commandName = arg.name;
        member = message.member;
        guildId = message.guildId;
    } else {
        if (arg.isContextMenu() || arg.isCommand()) {
            try {
                commandName = arg.options.getSubcommand(true);
            } catch {
                commandName = arg.commandName;
            }
            const group = arg.options.getSubcommandGroup(false);
            if (ObjectUtil.validString(group)) {
                commandName = group + commandName;
            }
            if (arg.member instanceof GuildMember) {
                member = arg.member;
            }
            guildId = arg.guildId;
        }
    }
    if (!ObjectUtil.validString(commandName) || !ObjectUtil.validString(guildId) || !member) {
        return;
    }
    const securityManager = container.resolve(CommandSecurityManager);
    const isEnabled = await securityManager.isEnabled(commandName, guildId);
    if (arg instanceof SimpleCommandMessage) {
        const canRun = await securityManager.canRunCommand(member, commandName);
        if (canRun && isEnabled) {
            return next();
        }
        const message = arg.message;
        return message.reply("you do not have permissions to use this command");
    } else {
        if (isEnabled) {
            return next();
        }
        return DiscordUtils.InteractionUtils.replyOrFollowUp(arg, `<@${member.id}>, you do not have permissions to the command: "${commandName}"`, false);
    }
};