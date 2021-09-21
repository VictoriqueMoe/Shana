import {Discord, Guard, SimpleCommand, SimpleCommandMessage, SlashGroup} from "discordx";
import {NotBotInteraction} from "../../guards/NotABot";
import {ArrayUtils, ObjectUtil, StringUtils} from "../../utils/Utils";
import {GuildMember, MessageEmbed} from "discord.js";
import {Main} from "../../Main";
import {SettingsManager} from "../../model/settings/SettingsManager";
import {SETTINGS} from "../../enums/SETTINGS";
import {CommandSecurityManager} from "../../model/guild/manager/CommandSecurityManager";
import {Typeings} from "../../model/types/Typeings";
import {AbstractCommandModule} from "../AbstractCommandModule";

@Discord()
@SlashGroup("Help", "Commands to display help and info")
export class Help extends AbstractCommandModule<any> {
    constructor() {
        super({
            module: {
                name: "Help",
                description: "Commands to display help and info"
            },
            commands: [
                {
                    name: "help",
                    isSlash: false,
                    description: {
                        text: "Get the description of a command or all commands",
                        examples: ['help = display ALL modules', 'help memes = display all the commands in the "memes" modules ', 'help memes 2 = get page 2 of commands in the memes module', 'help memes missionpassed = see the arguments and info for the "missionpassed" command'],
                        args: [
                            {
                                name: "Module",
                                optional: true,
                                type: "text",
                                description: "The module that you want to drill into"
                            },
                            {
                                name: "PageNumber",
                                optional: true,
                                type: "number",
                                description: "Some modules contain a lot of commands, and can't be displayed all at once, if this is the case, you can supply a page number \n NOTE: the 'Command' argument is invalid when this is supplied"
                            },
                            {
                                name: "Command",
                                optional: true,
                                type: "text",
                                description: "The command you want to see details of, This must be used conjunction with the Module argument"
                            }
                        ]
                    }
                }
            ]
        });
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
        const botImage = Main.client.user.displayAvatarURL({dynamic: true});
        const prefix = await SettingsManager.instance.getSetting(SETTINGS.PREFIX, member.guild.id);
        const highestRoleColour = member.roles.highest.hexColor;
        const embed = new MessageEmbed()
            .setColor(highestRoleColour)
            .setAuthor(`${Main.client.user.username}`, botImage)
            .setTimestamp();
        const availableModules = await CommandSecurityManager.instance.getCommandModulesForMember(member);
        if (!ArrayUtils.isValidArray(argumentArray)) {
            embed.setDescription(`The items shown below are all the modules supported by this bot, please run '${prefix} help "moduleName"' to see commands for modules and '${prefix} help "moduleName" "commandName"' for argument info`);
            embed.setTitle(`${Main.client.user.username} modules`);
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
                let {name, deprecated, isSlash, description: {args, examples, text}} = commandObj;
                const title = isSlash ? `/${name}` : `${prefix}${name}`;
                embed.setTitle(title);
                if (!ObjectUtil.validString(text)) {
                    text = "No description";
                }
                if (!isSlash) {
                    embed.setDescription(`${text} \n\nall arguments of type 'text' should be wrapped with speach marks: ""`);
                }
                if (ArrayUtils.isValidArray(examples) && !isSlash) {
                    embed.addField("Examples:", examples.map(example => `${prefix}${example}`).join("\n\n"));
                }
                embed.addField("Is a slash command", String(isSlash));
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
            if (!await CommandSecurityManager.instance.canRunCommand(member, name)) {
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
            fieldValue += `\n\nIs a slash command: ${command.isSlash}`;
            const nameToDisplay = command.isSlash ? `/${name}` : `${prefix}${name}`;
            embed.addField(nameToDisplay, fieldValue, resultOfPage.length > 5);
        }
    }
}