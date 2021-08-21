import {ObjectUtil} from "../utils/Utils";
import {Client, Next} from "discordx";
import {CommandSecurityManager} from "../model/guild/manager/CommandSecurityManager";
import {getPrefix} from "../Main";
import {Message} from "discord.js";

export async function secureCommand(message: Message, client: Client, next: Next): Promise<void> {
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
}