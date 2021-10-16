import {Discord, Guard, Slash, SlashChoice, SlashOption} from "discordx";
import {NotBotInteraction} from "../../guards/NotABot";
import {DiscordUtils} from "../../utils/Utils";
import {SettingsManager} from "../../model/settings/SettingsManager";
import {SETTINGS} from "../../enums/SETTINGS";
import {secureCommandInteraction} from "../../guards/RoleConstraint";
import {ICloseableModule} from "../../model/closeableModules/ICloseableModule";
import {AutoRoleSettings} from "../../model/closeableModules/AutoRoleSettings";
import {AutoRole} from "../../events/closeableModules/autoRole/AutoRole";
import {AbstractCommandModule} from "../AbstractCommandModule";
import {CommandInteraction} from "discord.js";
import {container} from "tsyringe";
import InteractionUtils = DiscordUtils.InteractionUtils;

enum SAVABLE_SETTINGS {
    AutoRoleAutoMute = "AutoRoleAutoMute",
    AutoAutoJail = "AutoAutoJail",
    AutoRoleMinAccountAge = "AutoRoleMinAccountAge",
    massJoinProtection = "massJoinProtection",
    autoRoleTimeout = "autoRoleTimeout"
}

const SETTINGS_SAVABLE = {...SETTINGS, ...SAVABLE_SETTINGS};
type SETTINGS_SAVABLE = keyof typeof SETTINGS_SAVABLE;

@Discord()
export class SettingsCommands extends AbstractCommandModule<any> {

    constructor() {
        super({
            module: {
                name: "Settings",
                description: "Commands to change internal seetings of this bot"
            },
            commands: [
                {
                    name: "setting",
                    type: "slash",
                    description: {
                        text: "Change or set any setting",
                        args: [
                            {
                                name: "setting",
                                optional: false,
                                type: "text",
                                description: "the name of the setting you wish to change"
                            },
                            {
                                name: "value",
                                optional: false,
                                type: "text",
                                description: "the value of the setting"
                            }
                        ]
                    }
                }
            ]
        });
    }

    @Slash("setting", {
        description: "Change or set any setting"
    })
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async mute(
        @SlashChoice(SETTINGS_SAVABLE)
        @SlashOption("setting", {
            description: "the name of the setting you wish to change",
            required: true
        })
            setting: SETTINGS_SAVABLE,
        @SlashOption("value", {
            description: "the value of the setting",
            required: true
        })
            value: string,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply();
        const guildId = interaction.guild.id;
        switch (setting) {
            case SETTINGS.JAIL_ROLE:
            case SETTINGS.AUTO_ROLE:
            case SETTINGS.YOUNG_ACCOUNT_ROLE:
            case SETTINGS.MUTE_ROLE: {
                const theRole = interaction.guild.roles.cache.get(value);
                if (!theRole) {
                    return InteractionUtils.replyOrFollowUp(interaction, `Unable to find role with id ${value}`);
                }
                const settingsManager = container.resolve(SettingsManager);
                await settingsManager.saveOrUpdateSetting(setting as SETTINGS, value, guildId);
                break;
            }
            case SAVABLE_SETTINGS.massJoinProtection:
            case SAVABLE_SETTINGS.autoRoleTimeout:
            case SAVABLE_SETTINGS.AutoRoleMinAccountAge: {
                const settingValue = parseInt(value);
                if (isNaN(settingValue)) {
                    return InteractionUtils.replyOrFollowUp(interaction, "Please supply a number");
                }
                const autoRole: ICloseableModule<AutoRoleSettings> = container.resolve(AutoRole);
                const settingObj: AutoRoleSettings = {};
                if (setting === SAVABLE_SETTINGS.massJoinProtection) {
                    settingObj["massJoinProtection"] = settingValue;
                } else if (setting === SAVABLE_SETTINGS.AutoRoleMinAccountAge) {
                    settingObj["minAccountAge"] = settingValue;
                } else {
                    settingObj["autoRoleTimeout"] = settingValue;
                }
                try {
                    await autoRole.saveSettings(guildId, settingObj, true);
                } catch (e) {
                    return InteractionUtils.replyOrFollowUp(interaction, e.message);
                }
                break;
            }
            case SAVABLE_SETTINGS.AutoAutoJail:
            case SAVABLE_SETTINGS.AutoRoleAutoMute:
            case SETTINGS.PANIC_MODE: {
                const settingValue = value === "true";
                const autoRole: ICloseableModule<AutoRoleSettings> = container.resolve(AutoRole);
                const settingObj: AutoRoleSettings = {};
                if (setting === SAVABLE_SETTINGS.AutoAutoJail) {
                    settingObj["autoJail"] = settingValue;
                } else if (setting === SAVABLE_SETTINGS.AutoRoleAutoMute) {
                    settingObj["autoMute"] = settingValue;
                } else if (setting === SETTINGS.PANIC_MODE) {
                    settingObj["panicMode"] = settingValue;
                }
                try {
                    await autoRole.saveSettings(guildId, settingObj, true);
                } catch (e) {
                    return InteractionUtils.replyOrFollowUp(interaction, e.message);
                }
                break;
            }
        }
        return InteractionUtils.replyOrFollowUp(interaction, `Setting "${setting}" has been saved with value ${value}`);
    }

}