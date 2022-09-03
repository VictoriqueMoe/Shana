import {Client, DApplicationCommand, Discord, Guard, MetadataStorage, SelectMenuComponent, Slash} from "discordx";
import {ICategory, NotBot} from "@discordx/utilities";
import {DiscordUtils, ObjectUtil} from "../../utils/Utils.js";
import {PostConstruct} from "../../model/framework/decorators/PostConstruct.js";
import {
    ActionRowBuilder,
    ApplicationCommand,
    ApplicationCommandPermissions,
    ApplicationCommandPermissionType,
    ApplicationCommandType,
    Collection,
    CommandInteraction,
    EmbedBuilder,
    GuildMember,
    inlineCode,
    Message,
    SelectMenuBuilder,
    SelectMenuComponentOptionData,
    SelectMenuInteraction
} from "discord.js";
import InteractionUtils = DiscordUtils.InteractionUtils;

type CatCommand = {
    name: string,
    description: string,
    isGroup: boolean,
    command: ApplicationCommand
} & ICategory;

@Discord()
export class Help {

    private readonly _catMap: Map<string, Map<string, CatCommand[]>> = new Map();

    @Slash({
        description: "Get the description of all commands"
    })
    @Guard(NotBot)
    public async help(interaction: CommandInteraction, client: Client): Promise<void> {
        await interaction.deferReply();
        const guildId = interaction.guildId;
        const channelId = interaction.channelId;
        if (!this._catMap.has(guildId)) {
            await this.populateGuildMap(guildId, client);
        }
        const member = interaction.member as GuildMember;
        const overridePermissions = await client.application.commands.permissions.fetch({guild: guildId});
        const embed = this.displayCategory(guildId, client, member, channelId, overridePermissions);
        const selectMenu = this.getSelectDropdown(guildId, client, member, channelId, overridePermissions);
        return InteractionUtils.replyOrFollowUp(interaction, {
            embeds: [embed],
            components: [selectMenu]
        });
    }

    @PostConstruct
    private async init(client: Client): Promise<void> {
        for (const [guildId] of client.guilds.cache) {
            await this.populateGuildMap(guildId, client);
        }
    }

    private async populateGuildMap(guildId: string, client: Client): Promise<void> {
        const commandManager = await client.application.commands.fetch({
            guildId
        });
        for (const [, command] of commandManager) {
            if (ObjectUtil.isValidArray(command.options)) {
                for (const opt of command.options) {
                    this.populateMap(opt.name, opt.description, command, guildId, true);
                }
                continue;
            }
            this.populateMap(command.name, command.description, command, guildId, false);
        }
    }

    private populateMap(commandName: string, commandDescription: string, parentCommand: ApplicationCommand, guildId: string, isGroup: boolean): void {
        const dCommand = MetadataStorage.instance.applicationCommandSlashesFlat.find(dCommand => dCommand.name === commandName) as DApplicationCommand & ICategory;
        let category = dCommand?.category;
        if (!ObjectUtil.validString(category)) {
            const commandType = parentCommand.type;
            if (commandType === ApplicationCommandType.Message || commandType === ApplicationCommandType.User) {
                category = "contextMenu";
            } else {
                category = parentCommand.name;
            }
        }
        const obj: CatCommand = {
            name: commandName,
            description: commandDescription,
            category,
            isGroup,
            command: parentCommand
        };
        if (!this._catMap.has(guildId)) {
            this._catMap.set(guildId, new Map());
        }
        if (this._catMap.get(guildId).has(category)) {
            this._catMap.get(guildId).get(category).push(obj);
        } else {
            this._catMap.get(guildId).set(category, [obj]);
        }
    }

    @SelectMenuComponent({
        id: "help-category-selector"
    })
    private async selectCategory(interaction: SelectMenuInteraction, client: Client): Promise<Message> {
        await interaction.deferUpdate();
        const member = interaction.member as GuildMember;
        const catToShow = interaction.values[0];
        const channelId = interaction.channelId;
        const guildId = interaction.guildId;
        const overridePermissions = await client.application.commands.permissions.fetch({guild: guildId});
        const categoryEmbed = this.displayCategory(interaction.guildId, client, member, channelId, overridePermissions, catToShow);
        const selectMenu = this.getSelectDropdown(interaction.guildId, client, member, channelId, overridePermissions, catToShow);
        return interaction.editReply({
            embeds: [categoryEmbed],
            components: [selectMenu]
        });
    }

    private getSelectDropdown(guildId: string,
                              client: Client,
                              member: GuildMember,
                              channelId: string,
                              overridePermissions: Collection<string, ApplicationCommandPermissions[]>,
                              defaultValue = "categories"): ActionRowBuilder<SelectMenuBuilder> {
        const optionsForEmbed: SelectMenuComponentOptionData[] = [];
        optionsForEmbed.push({
            description: "View all categories",
            label: "Categories",
            value: "categories",
            default: defaultValue === "categories"
        });
        for (const [cat] of this._catMap.get(guildId)) {
            const commandsForCat = this.getCommands(cat, guildId, client, member, channelId, overridePermissions);
            if (!ObjectUtil.isValidArray(commandsForCat)) {
                continue;
            }
            const description = `${cat} Commands`;
            optionsForEmbed.push({
                description,
                label: cat,
                value: cat,
                default: defaultValue === cat
            });
        }
        const selectMenu = new SelectMenuBuilder().addOptions(optionsForEmbed).setCustomId("help-category-selector");
        return new ActionRowBuilder<SelectMenuBuilder>().addComponents(selectMenu);
    }

    private displayCategory(guildId: string,
                            client: Client,
                            member: GuildMember,
                            channelId: string,
                            overridePermissions: Collection<string, ApplicationCommandPermissions[]>,
                            category = "categories",
                            pageNumber = 0): EmbedBuilder {
        if (category === "categories") {
            const embed = new EmbedBuilder()
                .setTitle(`${client.user.username} commands`)
                .setColor("#0099ff")
                .setDescription(`The items shown below are all the commands supported by this bot`)
                .setFooter({
                    text: `${client.user.username}`
                })
                .setTimestamp();
            for (const [cat] of this._catMap.get(guildId)) {
                const commands = this.getCommands(cat, guildId, client, member, channelId, overridePermissions);
                if (!ObjectUtil.isValidArray(commands)) {
                    continue;
                }
                const description = `${cat} Commands`;
                embed.addFields(ObjectUtil.singleFieldBuilder(cat, description));
            }
            return embed;
        }
        const commands = this.getCommands(category, guildId, client, member, channelId, overridePermissions);
        const chunks = this.chunk(commands, 24);
        const maxPage = chunks.length;
        const resultOfPage = chunks[pageNumber];
        const embed = new EmbedBuilder()
            .setTitle(`${category} Commands:`)
            .setColor("#0099ff")
            .setFooter({
                text: `${client.user.username} • Page ${pageNumber + 1} of ${maxPage}`
            })
            .setTimestamp();
        if (!resultOfPage) {
            return embed;
        }
        for (const item of resultOfPage) {
            const {description} = item;
            let fieldValue = "No description";
            if (ObjectUtil.validString(description)) {
                fieldValue = description;
            }
            let name = "";
            if (category === "contextMenu") {
                name = inlineCode(item.isGroup ? `/${item.command.name} ${item.name}` : `/${item.name}`);
            } else {
                name = item.isGroup ? `</${item.command.name} ${item.name}:${item.command.id}>` : `</${item.name}:${item.command.id}>`;
            }
            embed.addFields(ObjectUtil.singleFieldBuilder(name, fieldValue));
        }
        return embed;
    }

    private getCommands(categoryId: string,
                        guildId: string,
                        client: Client,
                        member: GuildMember,
                        channelId: string,
                        overridePermissions: Collection<string, ApplicationCommandPermissions[]>): CatCommand[] {
        const commands = this._catMap.get(guildId).get(categoryId);
        if (DiscordUtils.isMemberAdmin(member)) {
            return commands;
        }
        const toRemove: CatCommand[] = [];
        const hasGlobalOverrides = overridePermissions.has(client.application.id);
        for (const catCommand of commands) {
            const command = catCommand.command;
            const defaultPerms = command.defaultMemberPermissions;
            if (defaultPerms && !member.permissions.has(defaultPerms)) {
                toRemove.push(catCommand);
            }
            if (hasGlobalOverrides) {
                const globalOverrides = overridePermissions.get(client.application.id);
                this.calculatePermissions(globalOverrides, channelId, toRemove, catCommand, member);
            }
            const hasCommandPermissions = overridePermissions.has(command.id);
            if (hasCommandPermissions) {
                const applicationCommandPermissions = overridePermissions.get(command.id);
                this.calculatePermissions(applicationCommandPermissions, channelId, toRemove, catCommand, member);
            }
        }
        return commands.filter(el => !toRemove.includes(el));
    }

    private calculatePermissions(applicationCommandPermissions: ApplicationCommandPermissions[],
                                 channelId: string,
                                 toRemove: CatCommand[],
                                 catCommand: CatCommand,
                                 member: GuildMember): void {
        function addOrRemove(this: void, permission: boolean, toRemove: CatCommand[], catCommand: CatCommand): void {
            if (permission) {
                if (!toRemove.includes(catCommand)) {
                    toRemove.push(catCommand);
                }
            } else {
                ObjectUtil.removeObjectFromArray(catCommand, toRemove);
            }
        }

        if (ObjectUtil.isValidArray(applicationCommandPermissions)) {
            loop:
                for (const applicationCommandPermission of applicationCommandPermissions) {
                    switch (applicationCommandPermission.type) {
                        case ApplicationCommandPermissionType.Channel:
                            if (applicationCommandPermission.id === channelId) {
                                addOrRemove(applicationCommandPermission.permission, toRemove, catCommand);
                                break loop;
                            }
                            break;
                        case ApplicationCommandPermissionType.User:
                            if (applicationCommandPermission.id === member.id) {
                                addOrRemove(applicationCommandPermission.permission, toRemove, catCommand);
                                break loop;
                            }
                            break;
                        case ApplicationCommandPermissionType.Role:
                            const memberRoles = [...member.roles.cache.values()];
                            if (memberRoles.some(role => role.id === applicationCommandPermission.id)) {
                                addOrRemove(applicationCommandPermission.permission, toRemove, catCommand);
                                break loop;
                            }
                            break;
                    }
                }
        }
    }

    private chunk<T>(array: T[], chunkSize: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
}
