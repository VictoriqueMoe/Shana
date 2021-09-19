import {DiscordUtils, ObjectUtil} from "../utils/Utils";
import {ArgsOf, GuardFunction, SimpleCommandMessage} from "discordx";
import {CommandSecurityManager} from "../model/guild/manager/CommandSecurityManager";
import {getPrefix} from "../Main";
import {CommandInteraction, GuildMember} from "discord.js";

export const secureCommand: GuardFunction<ArgsOf<"messageCreate">> = async (
    [message],
    client,
    next
) => {
    const prefix = await getPrefix(message);
    const commandName = message.content.split(prefix)[1].split(" ")[0];
    if (!ObjectUtil.validString(commandName)) {
        return;
    }
    const canRun = await CommandSecurityManager.instance.canRunCommand(message.member, commandName);
    const isEnabled = await CommandSecurityManager.instance.isEnabled(commandName, message.guild.id);
    if (canRun && isEnabled) {
        return await next();
    }
    message.reply("you do not have permissions to use this command");
};

export const secureCommandInteraction: GuardFunction<CommandInteraction | SimpleCommandMessage> = async (arg, client, next) => {
    let commandName = "";
    let member: GuildMember = null;
    let guildId = "";
    if (arg instanceof CommandInteraction) {
        commandName = arg.commandName;
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
    const canRun = await CommandSecurityManager.instance.canRunCommand(member, commandName);
    const isEnabled = await CommandSecurityManager.instance.isEnabled(commandName, guildId);
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