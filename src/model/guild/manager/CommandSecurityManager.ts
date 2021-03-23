import {BaseDAO} from "../../../DAO/BaseDAO";
import {CommandSecurityModel} from "../../DB/guild/CommandSecurity.model";
import {GuildMember} from "discord.js";
import {DIService} from "@typeit/discord";
import {AbstractCommand} from "../../../commands/AbstractCommand";
import {GuildUtils, ObjectUtil} from "../../../utils/Utils";

export class CommandSecurityManager extends BaseDAO<CommandSecurityModel> {
    private readonly commandClasses: AbstractCommand<any> [];

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

    /**
     * Change to return JSON object with modules and commands for the user
     * @param member
     */
    public async getCommandModulesForMember(member: GuildMember): Promise<AbstractCommand<any> []> {
        if (GuildUtils.isMemberAdmin(member)) {
            return this.commandClasses;
        }
        const retArray: AbstractCommand<any>[] = [];
        const memberRoles = member.roles.cache.keyArray();
        const allCommands = await CommandSecurityModel.findAll({
            where: {
                guildId: member.guild.id
            }
        });
        outer:
            for (const commandClass of this.commandClasses) {
                const {commands} = commandClass.commandDescriptors;
                for (const commandDescriptor of commands) {
                    const {name} = commandDescriptor;
                    const command = allCommands.find(command => command.commandName === name);
                    if (!command) {
                        continue outer;
                    }
                    if (command.allowedRoles.includes("*")) {
                        retArray.push(commandClass);
                        continue outer;
                    }
                    const inArray = command.allowedRoles.some(value => memberRoles.includes(value));
                    if (inArray) {
                        retArray.push(commandClass);
                        continue outer;
                    }
                }
            }
        return retArray;
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