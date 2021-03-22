import {AbstractCommand} from "./AbstractCommand";
import {Command, CommandMessage, DIService, Guard} from "@typeit/discord";
import {NotBot} from "../guards/NotABot";
import {ObjectUtil} from "../utils/Utils";
import {MessageEmbed} from "discord.js";
import {Main} from "../Main";
import {CommandSecurityManager} from "../model/guild/manager/CommandSecurityManager";
import {SettingsManager} from "../model/settings/SettingsManager";
import {SETTINGS} from "../enums/SETTINGS";
import {Meme} from "./fun/Meme";

export class Help extends AbstractCommand<any> {
    constructor() {
        super({
            commands: [
                {
                    name: "help",
                    description: {
                        text: "Get the description of a command or all commands",
                        examples: ['help = display ALL commands', 'help mute = get help for the mute command'],
                        args: [
                            {
                                name: "Command",
                                optional: true,
                                type: "text",
                                description: "The command you want to see details of, if omitted, then only high level info for each command is shown"
                            }
                        ]
                    }
                }
            ]
        });
    }

    @Command("help")
    @Guard(NotBot)
    private async mute(command: CommandMessage): Promise<void> {
        // @ts-ignore
        const allCommands: Map = DIService.instance._services;
        const commandClasses: AbstractCommand<any> [] = [];
        for (const [, instance] of allCommands) {
            if (instance instanceof AbstractCommand) {
                if (!ObjectUtil.isValidObject(instance.commandDescriptors)) {
                    continue;
                }
                commandClasses.push(instance);
            }
        }
        const member = command.member;
        const botImage = Main.client.user.displayAvatarURL({dynamic: true});
        const prefix = await SettingsManager.instance.getSetting(SETTINGS.PREFIX, member.guild.id);
        const highestRoleColour = member.roles.highest.hexColor;
        const embed = new MessageEmbed()
            .setColor(highestRoleColour)
            .setTitle(`${Main.client.user.username} commands`)
            .setAuthor(`${Main.client.user.username}`, botImage)
            .setDescription(`Commands shown below are a shallow outline of all commands, to see more info for a command, please run '${prefix} help "commandName"'`)
            .setTimestamp();

        for (const commandClass of commandClasses) {
            if(commandClass instanceof Meme){
                continue;
            }
            const {commands} = commandClass.commandDescriptors;
            for (let i = 0; i < commands.length; i++) {
                const commandDescriptor = commands[i];
                const {name, description, depricated} = commandDescriptor;
                if (!await CommandSecurityManager.instance.canRunCommand(member, name)) {
                    continue;
                }
                let fieldValue = "N/A";
                if (ObjectUtil.isValidObject(description) && ObjectUtil.validString(description.text)) {
                    fieldValue = description.text;
                }
                embed.addField(`${prefix}${name}`, fieldValue);
            }
        }
        command.reply(embed);
    }
}