import {Command, CommandMessage, Guard} from "@typeit/discord";
import {NotBot} from "../../guards/NotABot";
import {AdminOnlyTask} from "../../guards/AdminOnlyTask";
import {ObjectUtil, StringUtils} from "../../utils/Utils";
import {SettingsManager} from "../../model/settings/SettingsManager";
import {DEFAULT_SETTINGS, SETTINGS} from "../../enums/SETTINGS";
import {AbstractCommand} from "../AbstractCommand";

export class SettingsCommands extends AbstractCommand<any> {

    constructor() {
        super({
            commands: [
                {
                    name: "prefix",
                    description: {
                        text: "Change the global prefix for this bot",
                        examples: ["prefix '_' = change prefix to _"],
                        args: [
                            {
                                name: "prefix",
                                type: "text",
                                optional: true,
                                description: "Please ensure the prefix does NOT contain spaces"
                            }
                        ]
                    }
                }
            ]
        });
    }

    //TODO change to setting sub-settings
    @Command("prefix")
    @Guard(NotBot, AdminOnlyTask)
    private async setPrefix(command: CommandMessage): Promise<void> {
        const argumentArray = StringUtils.splitCommandLine(command.content);
        if (argumentArray.length !== 1 && argumentArray.length !== 0) {
            command.reply("Please supply one or zero argument(s) only");
            return;
        }
        const [prefix] = argumentArray;
        if (ObjectUtil.isNumeric(prefix)) {
            command.reply("Prefix can not be a number");
            return;
        }
        if (!ObjectUtil.validString(prefix)) {
            await SettingsManager.instance.saveOrUpdateSetting(SETTINGS.PREFIX, DEFAULT_SETTINGS.PREFIX, command.guild.id);
            command.reply(`Prefix has been reset to "${DEFAULT_SETTINGS.PREFIX}"`);
        } else {
            await SettingsManager.instance.saveOrUpdateSetting(SETTINGS.PREFIX, prefix, command.guild.id);
            command.reply(`Prefix has been changed to "${prefix}"`);
        }
    }
}