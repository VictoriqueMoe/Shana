import {ApplicationCommandPermissions, Guild} from "discord.js";
import {container} from "tsyringe";
import {CommandSecurityManager} from "../model/framework/manager/CommandSecurityManager";
import {ApplicationCommandMixin, ApplicationGuildMixin, SimpleCommandMessage} from "discordx";

export abstract class AbstractCommand {
    protected static async getPermissions(guild: Guild, command: ApplicationCommandMixin | SimpleCommandMessage): Promise<ApplicationCommandPermissions[]> {
        const securityManger = container.resolve(CommandSecurityManager);
        return securityManger.getPermissions(guild, command.name);
    }

    protected static async getDefaultPermissionAllow(mixin: SimpleCommandMessage | ApplicationGuildMixin): Promise<boolean> {
        const {name} = mixin;
        const guild = mixin instanceof SimpleCommandMessage ? mixin?.message?.guild : mixin.guild;
        if (!guild) {
            return false;
        }
        const securityManger = container.resolve(CommandSecurityManager);
        return securityManger.getDefaultPermissionAllow(guild, name);
    }
}
