import {GuildMember} from "discord.js";
import {container} from "tsyringe";
import {CommandSecurityManager} from "../model/guild/manager/CommandSecurityManager";
import {DApplicationCommand} from "discordx";

export abstract class AbstractCommandModule {


    public async getCommand(name: string, member?: GuildMember): Promise<DApplicationCommand> {
        const commandManager = container.resolve(CommandSecurityManager);

        for (const command of this._commands.commands) {
            if (command.name === name) {
                if (member) {
                    if (await commandManager.canRunCommand(member, name)) {
                        return command;
                    }
                    return null;
                }
                return command;
            }
        }
        return null;
    }

}