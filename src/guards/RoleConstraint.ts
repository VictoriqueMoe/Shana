import {DiscordUtils, ObjectUtil} from "../utils/Utils";
import {GuardFunction, SimpleCommandMessage} from "discordx";
import {CommandSecurityManager} from "../model/guild/manager/CommandSecurityManager";
import {getPrefix} from "../Main";
import {CommandInteraction, ContextMenuInteraction, GuildMember} from "discord.js";
import {container} from "tsyringe";
import InteractionUtils = DiscordUtils.InteractionUtils;

export const secureCommandInteraction: GuardFunction<CommandInteraction | SimpleCommandMessage | ContextMenuInteraction> = async (arg, client, next) => {
    let commandName = "";
    let member: GuildMember = null;
    let guildId = "";
    if (arg instanceof SimpleCommandMessage) {
        const message = arg.message;
        const prefix = await getPrefix(message);
        commandName = message.content.split(prefix)[1].split(" ")[0];
        member = message.member;
        guildId = message.guildId;
    } else {
        if (arg.isContextMenu() || arg.isCommand()) {
            try {
                commandName = arg.options.getSubcommand(true);
            } catch {
                commandName = arg.commandName;
            }
            if (arg.member instanceof GuildMember) {
                member = arg.member;
            }
            guildId = arg.guildId;
        }
    }
    if (!ObjectUtil.validString(commandName) || !ObjectUtil.validString(guildId) || !member) {
        if (!(arg instanceof SimpleCommandMessage)) {
            return DiscordUtils.InteractionUtils.replyOrFollowUp(arg, "Unable to execute command", false);
        }
        return;
    }
    const securityManager = container.resolve(CommandSecurityManager);
    const canRun = await securityManager.canRunCommand(member, commandName);
    const isEnabled = await securityManager.isEnabled(commandName, guildId);
    if (canRun && isEnabled) {
        return next();
    }
    if (arg instanceof SimpleCommandMessage) {
        const message = arg.message;
        message.reply("you do not have permissions to use this command");
    } else {
        if (arg.isContextMenu()) {
            const targetType = arg.targetType;
            if (targetType === "USER") {
                const userTargeted = InteractionUtils.getUserFromUserContextInteraction(arg);
                return DiscordUtils.InteractionUtils.replyOrFollowUp(arg, `<@${member.id}>, you do not have permissions to the command: "${commandName}" against ${userTargeted.user.tag} `, false);
            }
        }
        return DiscordUtils.InteractionUtils.replyOrFollowUp(arg, `<@${member.id}>, you do not have permissions to the command: "${commandName}"`, false);
    }
};