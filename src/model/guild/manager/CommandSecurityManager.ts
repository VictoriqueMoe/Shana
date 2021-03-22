import {BaseDAO} from "../../../DAO/BaseDAO";
import {CommandSecurityModel} from "../../DB/guild/CommandSecurity.model";
import {GuildMember} from "discord.js";
import {DIService} from "@typeit/discord";
import {AbstractCommand} from "../../../commands/AbstractCommand";
import {GuildUtils, ObjectUtil} from "../../../utils/Utils";

export class CommandSecurityManager extends BaseDAO<CommandSecurityModel> {
    private commandClasses: AbstractCommand<any> [];

    private constructor() {
        super();
        // @ts-ignore
        const allCommands: Map = DIService.instance._services;
        this.commandClasses = [];
        for (const [, instance] of allCommands) {
            if (instance instanceof AbstractCommand) {
                if (!ObjectUtil.isValidObject(instance.commandDescriptors)) {
                    continue;
                }
                this.commandClasses.push(instance);
            }
        }
    }

    private static _instance: CommandSecurityManager;

    public static get instance(): CommandSecurityManager {
        if (!CommandSecurityManager._instance) {
            CommandSecurityManager._instance = new CommandSecurityManager();
        }
        return CommandSecurityManager._instance;
    }

    public get runnableCommands(): AbstractCommand<any>[] {
        return this.commandClasses;
    }

    public async canRunCommand(member: GuildMember, commandName: string): Promise<boolean> {
        if (GuildUtils.isMemberAdmin(member)) {
            return true;
        }
        const allCommands = await CommandSecurityModel.findAll({
            where: {
                guildId: member.guild.id
            }
        });
        const memberRoles = member.roles.cache.keyArray();
        for (const commandClass of this.commandClasses) {
            const {commands} = commandClass.commandDescriptors;
            for (const commandDescriptor of commands) {
                const {name} = commandDescriptor;
                if (commandName !== name) {
                    continue;
                }
                const command = allCommands.find(command => command.commandName === name);
                if (!command) {
                    continue;
                }
                if(command.allowedRoles.includes("*")){
                    return true;
                }
                const inArray = command.allowedRoles.some(value => memberRoles.includes(value));
                if (inArray) {
                    return true;
                }
            }
        }
        return false;
    }
}