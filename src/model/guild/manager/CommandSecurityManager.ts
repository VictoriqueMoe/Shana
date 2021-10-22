import {BaseDAO} from "../../../DAO/BaseDAO";
import {CommandSecurityModel} from "../../DB/guild/CommandSecurity.model";
import {ApplicationCommandPermissionData, Guild, GuildMember} from "discord.js";
import {DApplicationCommand, DIService, DOn, DSimpleCommand, MetadataStorage} from "discordx";
import {ArrayUtils, GuildUtils} from "../../../utils/Utils";
import {Typeings} from "../../types/Typeings";
import {Sequelize} from "sequelize-typescript";
import {container, singleton} from "tsyringe";
import constructor from "tsyringe/dist/typings/types/constructor";
import {PostConstruct} from "../../decorators/PostConstruct";
import UpdateCommandSettings = Typeings.UpdateCommandSettings;

export type AllCommands = (DSimpleCommand | DApplicationCommand)[];

@singleton()
export class CommandSecurityManager extends BaseDAO<CommandSecurityModel> {

    private readonly _metadata = MetadataStorage.instance;

    public constructor() {
        super();
    }

    @PostConstruct
    private async init(): Promise<void> {
        const appClasses = DIService.allServices;
        for (const classRef of appClasses) {
            container.resolve(classRef as constructor<any>);
        }
    }


    public get events(): readonly DOn[] {
        return this._metadata.events;
    }

    public get commands(): AllCommands {
        const simpleCommands = this._metadata.allSimpleCommands.map(value => value.command);
        const appCommands = this._metadata.allApplicationCommands;
        return [...simpleCommands, ...appCommands];
    }

    /**
     * Change to return JSON object with modules and commands for the user
     * @param member
     */
    public async getCommandModulesForMember(member: GuildMember): Promise<AllCommands> {
        if (GuildUtils.isMemberAdmin(member)) {
            return this.commands;
        }
        const retArray: AllCommands = [];
        const memberRoles = [...member.roles.cache.keys()];
        const allCommands = await CommandSecurityModel.findAll({
            where: {
                guildId: member.guild.id
            }
        });
        for (const commandClass of this.commands) {
            const {name} = commandClass;
            const command = allCommands.find(command => command.commandName === name);
            if (!command) {
                continue;
            }
            if (command.allowedRoles.includes("*")) {
                retArray.push(commandClass);
                continue;
            }
            const inArray = command.allowedRoles.some(value => memberRoles.includes(value));
            if (inArray) {
                retArray.push(commandClass);
            }
        }
        return retArray;
    }

    public async getPermissions(guild: Guild, commandName: string): Promise<ApplicationCommandPermissionData[]> {
        const guildId = guild.id;
        const commands = await this.getAllCommandModels(guildId, commandName, "allowedRoles");
        const allRoles = guild.roles.cache.map(role => role.id);
        return commands.flatMap(command => {
            let {allowedRoles} = command;
            let permission = true;
            if (!ArrayUtils.isValidArray(allowedRoles)) {
                // if empty array then only admins
                allowedRoles = allRoles;
                permission = false;
            } else if (allowedRoles.length === 1 && allowedRoles[0] === "*") {
                // if "*"  then everyone
                allowedRoles = allRoles;
                permission = true;
            }
            return allowedRoles.map(allowedRole => {
                return {
                    id: allowedRole,
                    type: "ROLE",
                    permission
                };
            });
        });
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
        const command = await this.getCommandModel(guildId, commandName, "enabled");
        if (!command) {
            console.error(`Unable to find command with name "${commandName}" from guildId: "${guildId}`);
            return false;
        }
        return command.enabled;
    }

    private async getCommandModel(guildId: string, commandName: string, ...attributes: string[]): Promise<CommandSecurityModel> {
        return CommandSecurityModel.findOne({
            attributes,
            where: {
                guildId,
                "commandName": Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('commandName')), 'LIKE', `%${commandName}%`)
            }
        });
    }

    private async getAllCommandModels(guildId: string, commandName: string, ...attributes: string[]): Promise<CommandSecurityModel[]> {
        return CommandSecurityModel.findAll({
            attributes,
            where: {
                guildId,
                "commandName": Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('commandName')), 'LIKE', `%${commandName}%`)
            }
        });
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
        for (const commandClass of this.commands) {
            const {name} = commandClass;
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
        return false;
    }
}