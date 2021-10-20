import {ObjectUtil} from "../utils/Utils";
import {GuardFunction, SimpleCommandMessage} from "discordx";
import {CommandSecurityManager} from "../model/guild/manager/CommandSecurityManager";
import {container} from "tsyringe";

export const secureCommandInteraction: GuardFunction<SimpleCommandMessage> = async (arg, client, next) => {
    const message = arg.message;
    const commandName = arg.name;
    const member = message.member;
    const guildId = message.guildId;
    if (!ObjectUtil.validString(commandName) || !ObjectUtil.validString(guildId) || !member) {
        return;
    }
    const securityManager = container.resolve(CommandSecurityManager);
    const canRun = await securityManager.canRunCommand(member, commandName);
    const isEnabled = await securityManager.isEnabled(commandName, guildId);
    if (canRun && isEnabled) {
        return next();
    }
    return message.reply("you do not have permissions to use this command");
};