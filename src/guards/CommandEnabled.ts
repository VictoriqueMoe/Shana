import {DiscordUtils} from "../utils/Utils";
import type {Client, GuardFunction, Next} from "discordx";
import {SimpleCommandMessage} from "discordx";
import {CommandSecurityManager} from "../model/framework/manager/CommandSecurityManager";
import type {CommandInteraction, ContextMenuInteraction} from "discord.js";
import {container} from "tsyringe";
import type {ModuleEnabledConfigure} from "../model/Impl/ModuleEnabledConfigure";

const securityManager = container.resolve(CommandSecurityManager);

export function CommandEnabled(manager?: ModuleEnabledConfigure): GuardFunction<CommandInteraction | SimpleCommandMessage | ContextMenuInteraction> {

    return async function (arg: CommandInteraction | SimpleCommandMessage | ContextMenuInteraction, client: Client, next: Next) {
        let commandName = "";
        let guildId = "";
        if (arg instanceof SimpleCommandMessage) {
            commandName = arg.name;
            guildId = arg.message.guild.id;
        } else {
            if (arg.isContextMenu() || arg.isCommand()) {
                commandName = arg.commandName;
                guildId = arg.guildId;
            }
        }

        const commandEnabled = manager ? manager.enabled : true;
        if (commandEnabled && await securityManager.isEnabled(commandName, guildId)) {
            return next();
        }
        if (arg instanceof SimpleCommandMessage) {
            const {message} = arg;
            return message.reply("This command is not enabled");
        } else {
            return DiscordUtils.InteractionUtils.replyOrFollowUp(arg, `This command is not enabled`, true);
        }
    };
}
