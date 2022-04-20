import {AbstractCommand} from "../AbstractCommand";
import {
    Client,
    DefaultPermissionResolver,
    Discord,
    Guard,
    Permission,
    SelectMenuComponent,
    Slash,
    SlashOption
} from "discordx";
import {
    AutocompleteInteraction,
    CommandInteraction,
    GuildMember,
    MessageActionRow,
    MessageEmbed,
    MessageSelectMenu,
    MessageSelectOptionData,
    SelectMenuInteraction
} from "discord.js";
import {NotBot} from "@discordx/utilities";
import {CommandEnabled} from "../../guards/CommandEnabled";
import {ArrayUtils, DiscordUtils, ObjectUtil, StringUtils} from "../../utils/Utils";
import {delay, inject, injectable} from "tsyringe";
import {CommandSecurityManager} from "../../model/framework/manager/CommandSecurityManager";
import {SettingsManager} from "../../model/framework/manager/SettingsManager";
import {defaultSearch, fuseOptions, ISearchBase, SearchBase} from "../../model/ISearchBase";
import Fuse from "fuse.js";
import {PostConstructDependsOn} from "../../model/decorators/PostConstruct";
import {ShanaFuse} from "../../model/Impl/ShanaFuse";
import {
    Category,
    CategoryMetaData,
    ICategory,
    ICategoryAttachment,
    ICategoryItem,
    ICategoryItemCommand,
    ICategoryItemOption
} from "../../modules/category";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@Category("Help", "Commands to display help and info")
@Category("Help", [
    {
        name: "help",
        description: "Display all the categories and commands",
        type: "SLASH",
        options: [
            {
                name: "CommandName",
                type: "STRING",
                description: "The command you wish to see help for",
                optional: true
            },
            {
                name: "public",
                type: "BOOLEAN",
                description: "If true, this message will be viewable by all",
                optional: true
            }
        ]
    }
])
@Permission(new DefaultPermissionResolver(AbstractCommand.getDefaultPermissionAllow))
@Permission(AbstractCommand.getPermissions)
@injectable()
export class Help extends AbstractCommand implements ISearchBase<SearchBase> {

    private _fuseCache: ShanaFuse<SearchBase>;

    constructor(@inject(delay(() => CommandSecurityManager))
                private _commandSecurityManager: CommandSecurityManager,
                private _client: Client,
                private _settingsManager: SettingsManager) {
        super();
    }

    @PostConstructDependsOn(CommandSecurityManager)
    private init(): void {
        const allCommandNames = this._commandSecurityManager.getAllCommandNames(true);
        const obj = allCommandNames.map(command => ({name: command}));
        this._fuseCache = new ShanaFuse(obj, fuseOptions);
    }

    @Slash("help", {
        description: "Get the description of a command or all commands"
    })
    @Guard(NotBot, CommandEnabled())
    private async help(
        @SlashOption("commandname", {
            description: "Command name to drill into",
            autocomplete: (interaction: AutocompleteInteraction) => ObjectUtil.search(interaction, Help),
            type: "STRING",
            required: false,
        })
            commandName: string,
        @SlashOption("public", {
            description: "Display this help publicly",
            required: false,
        })
            ephemeral: boolean,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply({
            ephemeral: !ephemeral
        });
        const member = InteractionUtils.getInteractionCaller(interaction);
        let embed: MessageEmbed = null;
        let catToDisplay = "categories";
        if (ObjectUtil.validString(commandName)) {
            try {
                const commandInfo = await this.getCommandInfo(commandName, member);
                embed = commandInfo[0];
                catToDisplay = commandInfo[1].name;
            } catch (e) {
                return InteractionUtils.replyOrFollowUp(interaction, e.message);
            }
        } else {
            embed = await this.displayCategory("categories", member);
        }
        const selectMenu = await this.getSelectDropdown(member, catToDisplay);
        interaction.editReply({
            content: "Select a category",
            embeds: [embed],
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
        const categoryEmbed = await this.displayCategory(catToShow, member);
        const selectMenu = await this.getSelectDropdown(member, catToShow);
        interaction.editReply({
            embeds: [categoryEmbed],
            components: [selectMenu]
        });

        /*const paginationResolver = new Pagination(async (page: number): Promise<embedType> => {
            const embed = await this.displayCategory(catToShow, member, page);
            return {
                embeds: [embed],
                components: [selectMenu]
            };
        }, this.getCategoryPageNumbers(catToShow));

        await sendPaginatedEmbeds(interaction, paginationResolver, {
            type: "BUTTON",
        });*/
    }

    public async getCommandInfo(commandName: string, caller: GuildMember): Promise<[MessageEmbed, ICategory]> {
        const availableCategories = await this._commandSecurityManager.getCommandModulesForMember(caller);
        if (!ArrayUtils.isValidArray(availableCategories)) {
            throw new Error(`You do not have permissions to view use any commands`);
        }
        const commandGroup = await this._commandSecurityManager.getCommandGroup(caller, commandName);
        const command: ICategoryItem | ICategoryItemCommand = commandGroup[1];
        const cat: ICategory = commandGroup[0];
        if (!command) {
            throw new Error(`Unable to find command: ${commandName}`);
        }
        const embed = new MessageEmbed();
        const {type, examples} = command;
        let {description} = command;
        const title = await this.getCommandName(command, cat, caller);
        const prefix = await this._settingsManager.getPrefix(caller?.guild?.id);
        embed.setTitle(title);
        if (!ObjectUtil.validString(description)) {
            description = "No description";
        }
        if (ArrayUtils.isValidArray(examples)) {
            embed.addField("Examples:", examples.map(example => `${prefix}${example}`).join("\n\n"));
        }
        embed.setDescription(description);
        embed.addField("Command type", type);
        if (this.isICategoryItemCommand(command)) {
            const {options, attachments} = command;
            if (ArrayUtils.isValidArray(options)) {
                embed.addField('Arguments:', '\u200b');
                for (const {name, description, type, optional} of options) {
                    const str = `***Description***: ${description} \n***Optional***: ${optional} \n***Type***: ${type}`;
                    embed.addField(name, str);
                }
            }
            if (ArrayUtils.isValidArray(attachments)) {
                embed.addField('attachments:', '\u200b');
                for (const {name, description, type, optional, extensions} of attachments) {
                    let str = `***Description***: ${description}\n***Optional***: ${optional}`;
                    if (ArrayUtils.isValidArray(extensions)) {
                        str += `\n***Allowed extensions*** ${extensions.join(", ")}`;
                    }
                    str += `\n***Type***: ${type}`;
                    embed.addField(name, str);
                }
            }
        }
        return [embed, cat];
    }

    private async displayCategory(category: string, caller: GuildMember, pageNumber: number = 0): Promise<MessageEmbed> {
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
            return embed;
        }
        const categoryObject = CategoryMetaData.categories.get(category);
        if (!categoryObject) {
            throw new Error(`Unable to find category ${category}`);
        }
        const {items} = categoryObject;
        const chunks = this.chunk(items, 24);
        const maxPage = chunks.length;
        const resultOfPage = chunks[pageNumber];
        const embed = new MessageEmbed();
        embed.setFooter(`Page ${pageNumber + 1} of ${maxPage}`);
        embed.addField('Commands:', '\u200b');
        if (!resultOfPage) {
            return embed;
        }
        for (const item of resultOfPage) {
            const {description, type} = item;
            if (!await this._commandSecurityManager.canRunCommand(caller, categoryObject, item)) {
                continue;
            }
            let fieldValue = "No description";
            if (ObjectUtil.validString(description)) {
                fieldValue = description;
            }
            if (this.isICategoryItemCommand(item)) {
                const {options, attachments} = item;
                const argumentsToUse: ICategoryItemOption[] | ICategoryAttachment[] = [...options ?? [], ...attachments ?? []];
                if (ArrayUtils.isValidArray(argumentsToUse)) {
                    const requiredArgs = argumentsToUse.filter(argumentToUse => !argumentToUse.optional).length;
                    if (requiredArgs > 0) {
                        fieldValue += `\n\n*this command requires: ${requiredArgs} mandatory arguments*`;
                    }
                }
            }
            fieldValue += `\n\nCommand type: ${type}`;
            const nameToDisplay = await this.getCommandName(item, categoryObject, caller);
            embed.addField(nameToDisplay, fieldValue, resultOfPage.length > 5);
        }
        // display a category
        return embed;
    }

    private async getCommandName(command: ICategoryItem | ICategoryItemCommand, cat: ICategory, caller: GuildMember): Promise<string> {
        const prefix = await this._settingsManager.getPrefix(caller?.guild?.id);
        const {name} = command;
        if (command.type === "SLASH") {
            return `/${cat.name.toLowerCase()} ${name}`;
        } else if (command.type === "SIMPLECOMMAND") {
            return `${prefix}${name}`;
        } else {
            return name;
        }
    }

    private isICategoryItemCommand(item: ICategoryItem | ICategoryItemCommand): item is ICategoryItemCommand {
        return item["options"];
    }

    private getCategoryPageNumbers(category: string): number {
        const categoryObject = CategoryMetaData.categories.get(category);
        return this.chunk(categoryObject.items, 24).length;
    }

    private chunk<T>(array: T[], chunkSize: number): T[][] {
        const r: T[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            r.push(array.slice(i, i + chunkSize));
        }
        return r;
    }

    public async search(interaction: AutocompleteInteraction): Promise<Fuse.FuseResult<SearchBase>[]> {
        const member = interaction.member;
        if (!(member instanceof GuildMember)) {
            return [];
        }
        const retArr: Fuse.FuseResult<SearchBase>[] = [];
        const results = defaultSearch(interaction, this._fuseCache);
        for (const result of results) {
            const commandName = result.item.name;
            const commandGroup = await this._commandSecurityManager.getCommandGroup(member, commandName);
            const [cat, command] = commandGroup;
            if (!cat || !command) {
                continue;
            }
            const canRun = this._commandSecurityManager.canRunCommand(member, cat, command);
            if (canRun) {
                retArr.push(result);
            }
        }
        return retArr;
    }
}
