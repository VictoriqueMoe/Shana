import {BaseDAO} from "../../../DAO/BaseDAO";
import {CommandSecurityModel} from "../../DB/guild/CommandSecurity.model";
import {GuildMember} from "discord.js";
import {DIService} from "discordx";
import {GuildUtils, ObjectUtil} from "../../../utils/Utils";
import {AbstractCommandModule} from "../../../commands/AbstractCommandModule";
import {Typeings} from "../../types/Typeings";
import {Sequelize} from "sequelize-typescript";
import UpdateCommandSettings = Typeings.UpdateCommandSettings;

export class CommandSecurityManager extends BaseDAO<CommandSecurityModel> {
    private readonly commandClasses: AbstractCommandModule<any> [];

    private constructor() {
        super();
        // @ts-ignore
        const allCommands: Map = DIService.instance._services;
        //TODO: maybe use MetadataStorage.instance.applicationCommands
        this.commandClasses = [];
        for (const [, instance] of allCommands) {
            if (instance instanceof AbstractCommandModule) {
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

    public get runnableCommands(): AbstractCommandModule<any>[] {
        return this.commandClasses;
    }

    /**
     * Change to return JSON object with modules and commands for the user
     * @param member
     */
    public async getCommandModulesForMember(member: GuildMember): Promise<AbstractCommandModule<any> []> {
        if (GuildUtils.isMemberAdmin(member)) {
            return this.commandClasses;
        }
        const retArray: AbstractCommandModule<any>[] = [];
        const memberRoles = [...member.roles.cache.keys()];
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

    public async updateCommand(commandName: string, guildId: string, settings: UpdateCommandSettings): Promise<boolean> {
        return (await CommandSecurityModel.update({
            allowedRoles: settings.roles,
            enabled: settings.enabled
        }, {
            where: {
                guildId,
                commandName
            }
        }))[0] === 1;
    }

    public async isEnabled(commandName: string, guildId: string): Promise<boolean> {
        const command = await CommandSecurityModel.findOne({
            attributes: ["enabled"],
            where: {
                guildId,
                "commandName": Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('commandName')), 'LIKE', `%${commandName}%`)
            }
        });
        if (!command) {
            console.error(`Unable to find command with name "${commandName}" from guildId: "${guildId}`);
            return false;
        }
        return command.enabled;
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
        const memberRoles = [...member.roles.cache.keys()];
        for (const commandClass of this.commandClasses) {
            const {commands} = commandClass.commandDescriptors;
            for (const commandDescriptor of commands) {
                const {name} = commandDescriptor;
                if (commandName.toUpperCase() !== name.toUpperCase()) {
                    continue;
                }
                const command = allCommands.find(command => command.commandName === name);
                if (!command) {
                    continue;
                }
                if (command.allowedRoles.includes("*")) {
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