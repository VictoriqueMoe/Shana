import {BaseDAO} from "../../../DAO/BaseDAO";
import {CommandSecurityModel} from "../../DB/guild/CommandSecurity.model";
import {ApplicationCommandPermissionData, Guild, GuildMember} from "discord.js";
import {Client, DApplicationCommand, DIService, DOn, DSimpleCommand, MetadataStorage} from "discordx";
import {ArrayUtils, GuildUtils} from "../../../utils/Utils";
import {Typeings} from "../../types/Typeings";
import {Sequelize} from "sequelize-typescript";
import {container, registry, singleton} from "tsyringe";
import constructor from "tsyringe/dist/typings/types/constructor";
import {PostConstruct} from "../../decorators/PostConstruct";
import {MemberLogger} from "../../../events/closeableModules/logging/admin/MemberLogger";
import {AuditLogger} from "../../../events/closeableModules/logging/mod/AuditLogger";
import {RoleLogger} from "../../../events/closeableModules/logging/admin/RoleLogger";
import {MessageLogger} from "../../../events/closeableModules/logging/admin/MessageLogger";
import {Beans} from "../../../DI/Beans";
import {AutoResponder} from "../../../managedEvents/messageEvents/closeableModules/AutoResponder";
import {ChannelLogger} from "../../../events/closeableModules/logging/admin/ChannelLogger";
import {DynoAutoMod} from "../../../managedEvents/messageEvents/closeableModules/DynoAutoMod";
import {AutoRole} from "../../../events/closeableModules/autoRole/AutoRole";
import {
    IPermissionEventListener,
    RoleTypes,
    RoleUpdateTrigger
} from "../../../events/eventDispatcher/Listeners/IPermissionEventListener";
import UpdateCommandSettings = Typeings.UpdateCommandSettings;

export type AllCommands = (DSimpleCommand | DApplicationCommand)[];

@registry([
    {token: Beans.ICloseableModuleToken, useToken: AuditLogger},
    {token: Beans.ICloseableModuleToken, useToken: DynoAutoMod},
    {token: Beans.ICloseableModuleToken, useToken: AuditLogger},
    {token: Beans.ICloseableModuleToken, useToken: RoleLogger},
    {token: Beans.ICloseableModuleToken, useToken: MemberLogger},
    {token: Beans.ICloseableModuleToken, useToken: ChannelLogger},
    {token: Beans.ICloseableModuleToken, useToken: MessageLogger},
    {token: Beans.ICloseableModuleToken, useToken: AutoRole},
    {token: Beans.ICloseableModuleToken, useToken: AutoResponder}
])
@singleton()
export class CommandSecurityManager extends BaseDAO<CommandSecurityModel> implements IPermissionEventListener {

    private readonly _metadata = MetadataStorage.instance;

    public constructor(private _client: Client) {
        super();
    }

    public async trigger(event: RoleUpdateTrigger, type: RoleTypes): Promise<void> {
        console.log(type);
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
        const simpleCommands = this._metadata.simpleCommands;
        const appCommands = this._metadata.applicationCommands;
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

    public async getDefaultPermissionAllow(guild: Guild, commandName: string): Promise<boolean> {
        const guildId = guild.id;
        const command = await this.getCommandModel(guildId, commandName, "allowedRoles");
        if (!ArrayUtils.isValidArray(command.allowedRoles)) {
            return false;
        }
        const {allowedRoles} = command;
        return allowedRoles.length === 1 && allowedRoles[0] === "*";
    }

    public async getPermissions(guild: Guild, commandName: string): Promise<ApplicationCommandPermissionData[]> {
        const guildId = guild.id;
        const command = await this.getCommandModel(guildId, commandName, "allowedRoles");
        const {allowedRoles} = command;
        if (!ArrayUtils.isValidArray(allowedRoles) || allowedRoles.length === 1 && allowedRoles[0] === "*") {
            // everyone or admin only return empty array
            return [];
        }
        return allowedRoles.map(allowedRole => {
            return {
                id: allowedRole,
                type: "ROLE",
                permission: true
            };
        });
    }

    public async updateCommand(commandName: string, guildId: string, settings: UpdateCommandSettings): Promise<boolean> {
        const result = await CommandSecurityModel.update({
            allowedRoles: settings.roles,
            enabled: settings.enabled
        }, {
            where: {
                guildId,
                commandName
            }
        });
        if (result[0] === 1) {
            await this._client.initApplicationPermissions();
            return true;
        }
        return false;
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

    /*public async canRunCommand(member: GuildMember, commandName: string): Promise<boolean> {
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
    }*/
}