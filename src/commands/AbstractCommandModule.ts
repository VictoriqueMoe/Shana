import {ApplicationCommandPermissionData, Guild} from "discord.js";
import {container} from "tsyringe";
import {CommandSecurityManager} from "../model/guild/manager/CommandSecurityManager";

export abstract class AbstractCommandModule {
    protected static async getPermissions(guild: Guild, commandName: string): Promise<ApplicationCommandPermissionData[]> {
        const securityManger = container.resolve(CommandSecurityManager);
        return securityManger.getPermissions(guild, commandName);
    }
}