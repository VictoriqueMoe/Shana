import {BaseDAO} from "../../../DAO/BaseDAO";
import {CommandSecurityModel} from "../../DB/guild/CommandSecurity.model";
import {GuildMember} from "discord.js";
import {DIService} from "discordx";
import {GuildUtils} from "../../../utils/Utils";
import {AbstractCommandModule} from "../../../commands/AbstractCommandModule";
import {Typeings} from "../../types/Typeings";
import {Sequelize} from "sequelize-typescript";
import {container, registry, singleton} from "tsyringe";
import constructor from "tsyringe/dist/typings/types/constructor";
import {PostConstruct} from "../../decorators/PostConstruct";
import {CloseableModule} from "../../closeableModules/impl/CloseableModule";
import {MemberLogger} from "../../../events/closeableModules/logging/admin/MemberLogger";
import {MessageLogger} from "../../../events/closeableModules/logging/admin/MessageLogger";
import {AutoResponder} from "../../../managedEvents/messageEvents/closeableModules/AutoResponder";
import {ChannelLogger} from "../../../events/closeableModules/logging/admin/ChannelLogger";
import {AutoRole} from "../../../events/closeableModules/autoRole/AutoRole";
import {Beans} from "../../../DI/Beans";
import {AuditLogger} from "../../../events/closeableModules/logging/mod/AuditLogger";
import {RoleLogger} from "../../../events/closeableModules/logging/admin/RoleLogger";
import {DynoAutoMod} from "../../../managedEvents/messageEvents/closeableModules/DynoAutoMod";
import UpdateCommandSettings = Typeings.UpdateCommandSettings;
import ICloseableModuleToken = Beans.ICloseableModuleToken;

@registry([
    {token: ICloseableModuleToken, useToken: AuditLogger},
    {token: ICloseableModuleToken, useToken: DynoAutoMod},
    {token: ICloseableModuleToken, useToken: AuditLogger},
    {token: ICloseableModuleToken, useToken: RoleLogger},
    {token: ICloseableModuleToken, useToken: MemberLogger},
    {token: ICloseableModuleToken, useToken: ChannelLogger},
    {token: ICloseableModuleToken, useToken: MessageLogger},
    {token: ICloseableModuleToken, useToken: AutoRole},
    {token: ICloseableModuleToken, useToken: AutoResponder}
])
@singleton()
export class CommandSecurityManager extends BaseDAO<CommandSecurityModel> {
    private _commandsAndEvents: (CloseableModule<any> | AbstractCommandModule<any>)[];

    public constructor() {
        super();
    }

    @PostConstruct
    private async init(): Promise<void> {
        const appClasses = DIService.allServices;
        this._commandsAndEvents = [];
        for (const classRef of appClasses) {
            const instance = container.resolve(classRef as constructor<any>);
            if (instance instanceof CloseableModule) {
                continue;
            }
            this._commandsAndEvents.push(instance);
        }
        const closeableModules = container.resolveAll<CloseableModule<any>>(ICloseableModuleToken);
        this._commandsAndEvents.push(...closeableModules);
    }

    public get commandsAndEvents(): (CloseableModule<any> | AbstractCommandModule<any>)[] {
        return this._commandsAndEvents;
    }

    public get events(): CloseableModule<any>[] {
        return this.commandsAndEvents.filter(c => c instanceof CloseableModule) as CloseableModule<any>[];
    }

    public get commands(): AbstractCommandModule<any>[] {
        return this.commandsAndEvents.filter(c => c instanceof AbstractCommandModule) as AbstractCommandModule<any>[];
    }

    /**
     * Change to return JSON object with modules and commands for the user
     * @param member
     */
    public async getCommandModulesForMember(member: GuildMember): Promise<AbstractCommandModule<any> []> {
        if (GuildUtils.isMemberAdmin(member)) {
            return this.commands;
        }
        const retArray: AbstractCommandModule<any>[] = [];
        const memberRoles = [...member.roles.cache.keys()];
        const allCommands = await CommandSecurityModel.findAll({
            where: {
                guildId: member.guild.id
            }
        });
        outer:
            for (const commandClass of this.commands) {
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
        for (const commandClass of this.commands) {
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