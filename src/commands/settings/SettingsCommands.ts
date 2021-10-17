import {Discord, Guard, Slash, SlashChoice, SlashGroup, SlashOption} from "discordx";
import {NotBotInteraction} from "../../guards/NotABot";
import {DiscordUtils, GuildUtils, ObjectUtil, TimeUtils} from "../../utils/Utils";
import {SettingsManager} from "../../model/settings/SettingsManager";
import {SETTINGS} from "../../enums/SETTINGS";
import {secureCommandInteraction} from "../../guards/RoleConstraint";
import {AutoRoleSettings} from "../../model/closeableModules/AutoRoleSettings";
import {AutoRole} from "../../events/closeableModules/autoRole/AutoRole";
import {AbstractCommandModule} from "../AbstractCommandModule";
import {CommandInteraction, MessageEmbed} from "discord.js";
import {injectable} from "tsyringe";
import {Typeings} from "../../model/types/Typeings";
import InteractionUtils = DiscordUtils.InteractionUtils;
import TIME_UNIT = TimeUtils.TIME_UNIT;
import AutoRoleSettingsEnum = Typeings.SETTINGS_RESOLVER.AutoRoleSettingsEnum;


const settingArgument: Typeings.Command["description"] = {
    text: "Change or set any global setting",
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
};

@Discord()
@SlashGroup("settings", "Get and Set settings for this bot", {
    set: "Command to set settings",
    get: "Commands to get settings"
})
@injectable()
export class SettingsCommands extends AbstractCommandModule<any> {

    constructor(private _settingsManager: SettingsManager, private _autoRole: AutoRole) {
        super({
            module: {
                name: "Settings",
                description: "Commands to change internal seetings of this bot"
            },
            commands: [
                {
                    name: "globalSettings",
                    type: "slash",
                    description: settingArgument
                },
                {
                    name: "autorole",
                    type: "slash",
                    description: {
                        text: "Get and set all the Auto Role settings"
                    }
                }
            ]
        });
    }

    @Slash("globalsettings", {
        description: "Change or set any global setting"
    })
    @SlashGroup("set")
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async globalSettings(
        @SlashChoice(SETTINGS)
        @SlashOption("setting", {
            description: "the name of the setting you wish to change",
            required: true
        })
            setting: SETTINGS,
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
            case SETTINGS.YOUNG_ACCOUNT_ROLE:
            case SETTINGS.MUTE_ROLE: {
                const theRole = interaction.guild.roles.cache.get(value);
                if (!theRole) {
                    return InteractionUtils.replyOrFollowUp(interaction, `Unable to find role with id ${value}`);
                }
                await this._settingsManager.saveOrUpdateSetting(setting as SETTINGS, value, guildId);
                break;
            }
        }
        return InteractionUtils.replyOrFollowUp(interaction, `Setting "${setting}" has been saved with value ${value}`);
    }

    @Slash("autorole", {
        description: "Change or set any setting to do with Auto roles"
    })
    @SlashGroup("set")
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async autoMuteSettings(
        @SlashChoice(AutoRoleSettingsEnum)
        @SlashOption("setting", {
            description: "the name of the setting you wish to change",
            required: true
        })
            setting: AutoRoleSettingsEnum,
        @SlashOption("value", {
            description: "the value of the setting",
            required: true
        })
            value: string,
        interaction: CommandInteraction
    ): Promise<void> {
        const guildId = interaction.guild.id;
        const settingObj: AutoRoleSettings = {};
        switch (setting) {
            // numbers
            case AutoRoleSettingsEnum.MASS_JOIN_PROTECTION:
            case AutoRoleSettingsEnum.MIN_ACCOUNT_AGE: {
                const settingValue = parseInt(value);
                if (isNaN(settingValue)) {
                    return InteractionUtils.replyOrFollowUp(interaction, "Please supply a number");
                }
                settingObj[setting] = settingValue;
                break;
            }
            // booleans
            case AutoRoleSettingsEnum.AUTO_JAIL:
            case AutoRoleSettingsEnum.AUTO_MUTE:
            case AutoRoleSettingsEnum.PANIC_MODE: {
                settingObj[setting] = value === "true";
                break;
            }
            // strings
            case AutoRoleSettingsEnum.ROLE:
                settingObj[setting] = value;
                break;
        }
        try {
            await this._autoRole.saveSettings(guildId, settingObj, true);
        } catch (e) {
            return InteractionUtils.replyOrFollowUp(interaction, e.message);
        }
    }


    @Slash("autorole", {
        description: "Get all the auto role settings"
    })
    @SlashGroup("get")
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async getGlobalSettings(interaction: CommandInteraction): Promise<void> {
        const {guild} = interaction;
        const guildId = guild.id;
        const settings = await this._autoRole.getSettings(guildId);
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setDescription("Below are the auto role settings of this server")
            .setAuthor(GuildUtils.getGuildName(guildId), GuildUtils.getGuildIconUrl(guildId))
            .setTimestamp();
        for (const setting in settings) {
            if (!settings.hasOwnProperty(setting)) {
                continue;
            }
            let value = settings[setting];
            switch (setting as keyof AutoRoleSettings) {
                case "minAccountAge": {
                    value = ObjectUtil.timeToHuman(value, TIME_UNIT.days);
                    break;
                }
                case "autoRoleTimeout": {
                    value = ObjectUtil.timeToHuman(value);
                    break;
                }
                case "role": {
                    const role = guild.roles.cache.get(value);
                    if (role) {
                        value = `<@&${value}>`;
                    }
                    break;
                }
            }
            embed.addField(setting, String(value));
        }
        interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }


}