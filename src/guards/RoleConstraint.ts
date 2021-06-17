import {ObjectUtil} from "../utils/Utils";
import {GuardFunction} from "@typeit/discord";
import {getPrefix} from "../discord/WeebBot";
import {CommandSecurityManager} from "../model/guild/manager/CommandSecurityManager";

export const secureCommand: GuardFunction<"message"> = async (
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