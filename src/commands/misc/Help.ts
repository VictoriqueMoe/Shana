import {AbstractCommandModule} from "../AbstractCommandModule";
import {
    Client,
    DefaultPermissionResolver,
    Discord,
    Guard,
    Permission,
    SelectMenuComponent,
    Slash,
    SlashGroup
} from "discordx";
import {Category, CategoryMetaData} from "@discordx/utilities";
import {ICategory} from "@discordx/utilities/build/category";
import {
    CommandInteraction,
    GuildMember,
    MessageActionRow,
    MessageEmbed,
    MessageSelectMenu,
    MessageSelectOptionData,
    SelectMenuInteraction
} from "discord.js";
import {NotBotInteraction} from "../../guards/NotABot";
import {CommandEnabled} from "../../guards/CommandEnabled";
import {DiscordUtils, ObjectUtil, StringUtils} from "../../utils/Utils";
import {delay, inject, injectable} from "tsyringe";
import {CommandSecurityManager} from "../../model/guild/manager/CommandSecurityManager";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@Category("Help", "Commands to display help and info")
@Category("Help", [])
@SlashGroup("help", "Commands to display help and info")
@Permission(new DefaultPermissionResolver(AbstractCommandModule.getDefaultPermissionAllow))
@Permission(AbstractCommandModule.getPermissions)
@injectable()
export class Help extends AbstractCommandModule {
    private static readonly categories: Map<string, ICategory> = CategoryMetaData.categories;

    constructor(@inject(delay(() => CommandSecurityManager)) private _commandSecurityManager: CommandSecurityManager, private _client: Client) {
        super();
    }

    @Slash("help", {
        description: "Get the description of a command or all commands"
    })
    @Guard(NotBotInteraction, CommandEnabled)
    private async help(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        const member = InteractionUtils.getInteractionCaller(interaction);
        const categoryEmbeds = await this.displayCategory("categories", member);
        const selectMenu = await this.getSelectDropdown(member);
        interaction.editReply({
            content: "Select a category",
            embeds: categoryEmbeds,
            components: [selectMenu]
        });
    }

    private async getSelectDropdown(caller: GuildMember, defaultValue?: string): Promise<MessageActionRow> {
        if (!ObjectUtil.validString(defaultValue)) {
            defaultValue = "categories";
        }
        const optionsForEmbed: MessageSelectOptionData[] = [];
        optionsForEmbed.push({
            description: "View all categories",
            label: "Categories",
            value: "categories",
            default: defaultValue === "categories",
        });
        const availableCategories = await this._commandSecurityManager.getCommandModulesForMember(caller);
        for (const category of availableCategories) {
            let {description} = category;
            const {name} = category;
            description = StringUtils.truncate(description, 100);
            optionsForEmbed.push({
                description,
                label: name,
                value: name,
                default: defaultValue === name
            });
        }
        const selectMenu = new MessageSelectMenu().addOptions(optionsForEmbed).setCustomId("help-category-selector");
        return new MessageActionRow().addComponents(selectMenu);
    }

    @SelectMenuComponent("help-category-selector")
    private async selectCategory(interaction: SelectMenuInteraction): Promise<void> {
        await interaction.deferUpdate();
        const catToShow = interaction.values[0];
        const member = InteractionUtils.getInteractionCaller(interaction);
        const categoryEmbeds = await this.displayCategory(catToShow, member);
        const selectMenu = await this.getSelectDropdown(member, catToShow);
        interaction.editReply({
            embeds: categoryEmbeds,
            components: [selectMenu]
        });
    }


    private async displayCategory(category: string, caller: GuildMember): Promise<MessageEmbed[]> {
        const returnArray: MessageEmbed[] = [];
        const botImage = this._client.user.displayAvatarURL({dynamic: true});
        const highestRoleColour = caller.roles.highest.hexColor;
        if (category === "categories") {
            const availableCategories = await this._commandSecurityManager.getCommandModulesForMember(caller);
            const embed = new MessageEmbed()
                .setColor(highestRoleColour)
                .setTitle(`${this._client.user.username} modules`)
                .setDescription(`The items shown below are all the modules supported by this bot`)
                .setAuthor(`${this._client.user.username}`, botImage)
                .setTimestamp();
            for (const category of availableCategories) {
                const moduleName = category.name;
                const moduleDescription = category.description;
                embed.addField(moduleName, moduleDescription);
            }
            return [embed];
        }
        const categoryObject = Help.categories.get(category);
        if (!categoryObject) {
            throw new Error(`Unable to find category ${category}`);
        }
        // display a category
        const embed = new MessageEmbed()
            .setTitle(category)
            .setTimestamp();
        returnArray.push(embed);
        return returnArray;
    }
}


/*
import {
    Client,
    DefaultPermissionResolver,
    Discord,
    Guard,
    Permission,
    SimpleCommand,
    SimpleCommandMessage
} from "discordx";
import {NotBotInteraction} from "../../guards/NotABot";
import {ArrayUtils, ObjectUtil, StringUtils} from "../../utils/Utils";
import {GuildMember, MessageEmbed} from "discord.js";
import {SettingsManager} from "../../model/settings/SettingsManager";
import {SETTINGS} from "../../enums/SETTINGS";
import {Typeings} from "../../model/types/Typeings";
import {AbstractCommandModule} from "../AbstractCommandModule";
import {container, delay, inject, injectable} from "tsyringe";
import {CommandSecurityManager} from "../../model/guild/manager/CommandSecurityManager";
import {Category} from "@discordx/utilities";
import Command = Typeings.Command;


@Discord()
@Category("Help", "Commands to display help and info")
@Category("Help", [
    {
        "name": "help",
        "type": "SIMPLECOMMAND",
        "options": [
            {
                "name": "Module",
                "description": "The module that you want to drill into",
                "optional": true,
                "type": "STRING"
            },
            {
                "name": "PageNumber",
                "description": "Some modules contain a lot of commands, and can't be displayed all at once, if this is the case, you can supply a page number \n NOTE: the 'Command' argument is invalid when this is supplied",
                "optional": true,
                "type": "NUMBER"
            },
            {
                "name": "Command",
                "description": "The command you want to see details of, This must be used conjunction with the Module argument",
                "optional": true,
                "type": "STRING"
            }
        ],
        "description": "Get the description of a command or all commands"
    }
])
@Permission(new DefaultPermissionResolver(AbstractCommandModule.getDefaultPermissionAllow))
@Permission(AbstractCommandModule.getPermissions)
@injectable()
export class Help extends AbstractCommandModule {

    constructor(@inject(delay(() => CommandSecurityManager)) private _commandSecurityManager: CommandSecurityManager, private _client: Client) {
        super();
    }


    @SimpleCommand("help")
    @Guard(NotBotInteraction)
    private async help({message}: SimpleCommandMessage): Promise<void> {
        const argumentArray = StringUtils.splitCommandLine(message.content);
        if (argumentArray.length !== 3 && argumentArray.length !== 2 && argumentArray.length !== 1 && argumentArray.length !== 0) {
            message.reply('Invalid arguments, please supply <"moduleName"> <"command from module OR page number">');
            return;
        }
        const member = message.member;
        const botImage = this._client.user.displayAvatarURL({dynamic: true});
        const settingsManager = container.resolve(SettingsManager);
        const prefix = await settingsManager.getSetting(SETTINGS.PREFIX, member.guild.id);
        const highestRoleColour = member.roles.highest.hexColor;
        const embed = new MessageEmbed()
            .setColor(highestRoleColour)
            .setAuthor(`${this._client.user.username}`, botImage)
            .setTimestamp();
        const availableModules = await this._commandSecurityManager.getCommandModulesForMember(member);
        if (!ArrayUtils.isValidArray(argumentArray)) {
            embed.setDescription(`The items shown below are all the modules supported by this bot, please run '${prefix} help "moduleName"' to see commands for modules and '${prefix} help "moduleName" "commandName"' for argument info`);
            embed.setTitle(`${this._client.user.username} modules`);
            for (const commandClass of availableModules) {
                const {module} = commandClass.commandDescriptors;
                const moduleName = module.name;
                const moduleDescription = module.description;
                embed.addField(moduleName, moduleDescription);
            }
        } else {
            const [moduleName, pageNumberOrCommand] = argumentArray;
            const moduleRequested = availableModules.find(m => m.commandDescriptors.module.name.toLowerCase() === moduleName.toLowerCase());
            if (!moduleRequested) {
                message.reply(`Invalid module: "${moduleName}" please run '${prefix}help' for a list of modules`);
                return;
            }
            let commandName = null;
            let pageNumber = 1;
            if (ObjectUtil.validString(pageNumberOrCommand)) {
                if (ObjectUtil.isNumeric(pageNumberOrCommand)) {
                    pageNumber = Number.parseInt(pageNumberOrCommand);
                } else {
                    commandName = pageNumberOrCommand;
                }
            }

            if (commandName) {
                const commandObj = await moduleRequested.getCommand(commandName, member);
                if (commandObj == null) {
                    message.reply(`Invalid command name: "${commandName}" Please run '${prefix}${moduleName}' for a list of commands`);
                    return;
                }
                // eslint-disable-next-line prefer-const
                let {type, description: {args, examples, text}} = commandObj;
                const title = this.getCommandName(commandObj, prefix);
                embed.setTitle(title);
                if (!ObjectUtil.validString(text)) {
                    text = "No description";
                }
                if (type === "command") {
                    embed.setDescription(`${text} \n\nall arguments of type 'text' should be wrapped with speach marks: ""`);
                }
                if (ArrayUtils.isValidArray(examples) && type === "command") {
                    embed.addField("Examples:", examples.map(example => `${prefix}${example}`).join("\n\n"));
                }
                embed.addField("Command type", type);
                if (ArrayUtils.isValidArray(args)) {
                    embed.addField('Arguments:', '\u200b');
                    for (const arg of args) {
                        const {name, description, optional, type} = arg;
                        const str = `***Description***: ${description} \n***Optional***: ${optional} \n***Type***: ${type}`;
                        embed.addField(name, str);
                    }
                }
            } else {
                const {name, description} = moduleRequested.commandDescriptors.module;
                embed.setDescription(`${description} \n \nif you wish to see the command in more detail like examples and arguments, please run "${prefix}help ${name} 'commandName' " \n\nyou may specify a page using: "${prefix}help ${name} 'pagenumber'"`);
                embed.setTitle(`${moduleName}`);
                const {commands} = moduleRequested.commandDescriptors;
                await this.populatePagedFields(pageNumber, commands, embed, member, prefix);
            }
        }
        message.reply({
            embeds: [embed]
        });
    }

    private getCommandName(command: Command, prefix: string): string {
        const {name} = command;
        if (command.type === "slash") {
            return `/${name}`;
        } else if (command.type === "command") {
            return `${prefix}${name}`;
        } else {
            return name;
        }
    }

    private static chunk<T>(array: T[], chunkSize: number): T[][] {
        const r: T[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            r.push(array.slice(i, i + chunkSize));
        }
        return r;
    }

    private async populatePagedFields(pageNumber: number, commands: Typeings.Command[], embed: MessageEmbed, member: GuildMember, prefix: string): Promise<void> {
        const chunks = Help.chunk(commands, 24);
        const maxPage = chunks.length;
        if (pageNumber > maxPage) {
            pageNumber = maxPage;
        }
        if (pageNumber < 1) {
            pageNumber = 1;
        }
        embed.setFooter(`Page ${pageNumber} of ${maxPage}`);
        embed.addField('Commands:', '\u200b');
        const resultOfPage = chunks[pageNumber - 1];
        for (const command of resultOfPage) {
            const {name, description, deprecated} = command;
            if (!await this._commandSecurityManager.canRunCommand(member, name)) {
                continue;
            }
            let fieldValue = "No description";
            if (ObjectUtil.isValidObject(description) && ObjectUtil.validString(description.text)) {
                fieldValue = description.text;
            }
            if (deprecated) {
                fieldValue += " \n\nThis command is deprecated and will be removed in the future";
            }
            if (ArrayUtils.isValidArray(description.args)) {
                const requiredArgs = description.args.filter(arg => !arg.optional).length;
                if (requiredArgs > 0) {
                    fieldValue += `\n\n*this command requires: ${requiredArgs} mandatory arguments*`;
                }
            }
            fieldValue += `\n\nCommand type: ${command.type}`;
            const nameToDisplay = this.getCommandName(command, prefix);
            embed.addField(nameToDisplay, fieldValue, resultOfPage.length > 5);
        }
    }
}
*/
