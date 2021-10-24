import {BaseDAO} from "../../../DAO/BaseDAO";
import {CommandSecurityModel} from "../../DB/guild/CommandSecurity.model";
import {ApplicationCommandPermissions, Guild, GuildMember, Permissions} from "discord.js";
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
import {ICategory, ICategoryItem, ICategoryItemCommand} from "@discordx/utilities/build/category";
import {CategoryMetaData} from "@discordx/utilities";
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

    @PostConstruct
    private async init(): Promise<void> {
        const appClasses = DIService.allServices;
        for (const classRef of appClasses) {
            container.resolve(classRef as constructor<any>);
        }
    }

    public async trigger([event]: RoleUpdateTrigger, type: RoleTypes): Promise<void> {
        const {guild} = event;
        console.log(`Reloading command permissions for guild: "${guild.name}"`);
        const commandsByGuild = await this._client.CommandByGuild();
        const pArr: Promise<void>[] = [];
        for (const [, guildCommand] of commandsByGuild) {
            pArr.push(this._client.initGuildApplicationPermissions(guild.id, guildCommand));
        }
        return Promise.all(pArr).then(() => {
            console.log(`Permissions for guild ${guild.name} has been reloaded`);
        });
    }

    public get events(): readonly DOn[] {
        return this._metadata.events;
    }

    public get commands(): AllCommands {
        const simpleCommands = this._metadata.simpleCommands;
        const appCommands = this._metadata.applicationCommands;
        return [...simpleCommands, ...appCommands];
    }

    public getAllCommandNames(includeAlias: boolean = false): string[] {
        if (!includeAlias) {
            return this.commands.map(command => command.name);
        }
        return this.commands.flatMap(command => {
            const {name} = command;
            if (command instanceof DSimpleCommand) {
                if (ArrayUtils.isValidArray(command.aliases)) {
                    const {aliases} = command;
                    const newAliases = aliases.filter(commandInArr => commandInArr !== name);
                    return [name, ...newAliases];
                }
            }
            return [name];
        });
    }

    public async getCommandsForMember(member: GuildMember, category: ICategory): Promise<(ICategoryItem | ICategoryItemCommand)[]> {

        function populateArray(this: CommandSecurityManager, command: CommandSecurityModel, item: (ICategoryItem | ICategoryItemCommand)): boolean {
            if (command.allowedRoles.includes("*")) {
                retArr.push(item);
                return true;
            }
            const inArray = command.allowedRoles.some(value => memberRoles.includes(value));
            if (inArray) {
                retArr.push(item);
                return true;
            }
            return false;
        }

        const retArr: (ICategoryItem | ICategoryItemCommand)[] = [];
        const memberRoles = [...member.roles.cache.keys()];
        const {items} = category;
        const allCommands = await CommandSecurityModel.findAll({
            where: {
                guildId: member.guild.id,
                allowedRoles: memberRoles
            }
        });
        const isCategory = allCommands.find(command => command.commandName.toLowerCase() === category.name.toLowerCase());
        if (isCategory) {
            for (const item of category.items) {
                retArr.push(item);
            }
        } else {
            for (const item of items) {
                const {name} = item;
                const command = allCommands.find(command => command.commandName.toLowerCase() === name.toLowerCase());
                if (!command) {
                    continue;
                }
                populateArray.call(this, command, item);
            }
        }
        return retArr;
    }

    /**
     * Get an array of categories a user is allowed to view
     * @param member
     */
    public async getCommandModulesForMember(member: GuildMember): Promise<ICategory[]> {
        function populateArray(this: CommandSecurityManager, command: CommandSecurityModel, category: ICategory): boolean {
            if (command.allowedRoles.includes("*")) {
                retArray.push(category);
                return true;
            }
            const inArray = command.allowedRoles.some(value => memberRoles.includes(value));
            if (inArray) {
                retArray.push(category);
                return true;
            }
            return false;
        }

        const catMap: Map<string, ICategory> = CategoryMetaData.categories;
        const categories = [...catMap.values()];
        if (GuildUtils.isMemberAdmin(member)) {
            return categories;
        }
        const retArray: ICategory[] = [];
        const memberRoles = [...member.roles.cache.keys()];
        const allCommands = await CommandSecurityModel.findAll({
            where: {
                guildId: member.guild.id
            }
        });
        outer:
            for (const category of categories) {
                const {name, items} = category;
                const command = allCommands.find(command => command.commandName.toLowerCase() === name.toLowerCase());
                const itemNames = items.map(item => item.name.toLowerCase());
                for (const itemName of itemNames) {
                    // check all the items first, because there could be a category with simple commands only OR context menu stuff
                    const command = allCommands.find(command => command.commandName.toLowerCase() === itemName);
                    if (!command) {
                        continue;
                    }
                    if (populateArray.call(this, command, category)) {
                        continue outer;
                    }
                }
                if (!command) {
                    continue;
                }
                populateArray.call(this, command, category);
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

    public async getPermissions(guild: Guild, commandName: string): Promise<ApplicationCommandPermissions[]> {
        const guildId = guild.id;
        const command = await this.getCommandModel(guildId, commandName, "allowedRoles");
        let {allowedRoles} = command;
        if (allowedRoles.length === 1 && allowedRoles[0] === "*") {
            // everyone access
            return [];
        }
        const roles = guild.roles.cache;
        const adminRoles = roles.filter(role => {
            return role.permissions.has(Permissions.FLAGS.ADMINISTRATOR, true);
        });
        if (!ArrayUtils.isValidArray(allowedRoles) && adminRoles.size > 0) {
            // only admins
            allowedRoles = adminRoles.map(role => role.id);
        } else {
            if (adminRoles.size > 0) {
                allowedRoles.push(...adminRoles.keys());
            }
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

    public async canRunCommand(member: GuildMember, category: ICategory, command: (ICategoryItem | ICategoryItemCommand)): Promise<boolean> {
        if (GuildUtils.isMemberAdmin(member)) {
            return true;
        }
        const commandsForCat = await this.getCommandsForMember(member, category);
        return commandsForCat.find(commandFromCat => commandFromCat === command) != null;
    }
}