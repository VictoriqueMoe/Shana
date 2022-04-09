import {
    DefaultPermissionResolver,
    Discord,
    Guard,
    Permission,
    Slash,
    SlashChoice,
    SlashGroup,
    SlashOption
} from "discordx";
import {DiscordUtils, GuildUtils, ObjectUtil, TimeUtils} from "../../utils/Utils";
import {SettingsManager} from "../../model/framework/manager/SettingsManager";
import {SETTINGS} from "../../enums/SETTINGS";
import {CommandEnabled} from "../../guards/CommandEnabled";
import {AutoRoleSettings} from "../../model/closeableModules/AutoRoleSettings";
import {AutoRole} from "../../events/closeableModules/autoRole/AutoRole";
import {AbstractCommand} from "../AbstractCommand";
import {CommandInteraction, MessageEmbed} from "discord.js";
import {injectable} from "tsyringe";
import {Typeings} from "../../model/types/Typeings";
import {Category} from "../../modules/category";
import {CloseableModuleManager} from "../../model/framework/manager/CloseableModuleManager";
import {NotBot} from "@discordx/utilities";
import InteractionUtils = DiscordUtils.InteractionUtils;
import AutoRoleSettingsEnum = Typeings.SETTINGS_RESOLVER.AutoRoleSettingsEnum;


@Discord()
@Category("Settings", "Commands to change internal settings of this bot")
@Category("Settings", [
    {
        "name": "globalSettings",
        "type": "SLASH",
        "options": [
            {
                "name": "setting",
                "description": "the name of the setting you wish to change",
                "optional": false,
                "type": "STRING"
            },
            {
                "name": "value",
                "description": "the value of the setting",
                "optional": false,
                "type": "STRING"
            }
        ],
        "description": "Change or set any global setting"
    },
    {
        "name": "autorole",
        "type": "SLASH",
        "options": [],
        "description": "Get and set all the Auto Role settings"
    }
])
@SlashGroup({
    name: "settings",
    description: "Get and Set settings for this bot",
})
@SlashGroup({
    name: "get",
    description: "Commands to get settings",
    root: "settings"
})
@SlashGroup({
    name: "set",
    description: "Commands to set settings",
    root: "settings"
})
@Permission(new DefaultPermissionResolver(AbstractCommand.getDefaultPermissionAllow))
@Permission(AbstractCommand.getPermissions)
@injectable()
export class SettingsCommands extends AbstractCommand {

    constructor(private _settingsManager: SettingsManager, private _closeableModuleManager: CloseableModuleManager) {
        super();
    }

    @Slash("globalsettings", {
        description: "Change or set any global setting"
    })
    @SlashGroup("set", "settings")
    @Guard(NotBot, CommandEnabled())
    private async globalSettings(
        @SlashChoice(...Object.keys(SETTINGS).map(key => ({name: key, value: SETTINGS[key]})))
        @SlashOption("setting", {
            description: "the name of the setting you wish to change",
        })
            setting: SETTINGS,
        @SlashOption("value", {
            description: "the value of the setting",
        })
            value: string,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply();
        const guildId = interaction.guild.id;
        switch (setting) {
            case SETTINGS.JAIL_ROLE:
            case SETTINGS.YOUNG_ACCOUNT_ROLE: {
                const theRole = interaction.guild.roles.cache.get(value);
                if (!theRole) {
                    return InteractionUtils.replyOrFollowUp(interaction, `Unable to find role with id ${value}`);
                }
            }
        }
        await this._settingsManager.saveOrUpdateSetting(setting as SETTINGS, value, guildId);
        return InteractionUtils.replyOrFollowUp(interaction, `Setting "${setting}" has been saved with value ${value}`);
    }

    @Slash("autorole", {
        description: "Change or set any setting to do with Auto roles"
    })
    @SlashGroup("set", "settings")
    @Guard(NotBot, CommandEnabled())
    private async autoMuteSettings(
        @SlashChoice(...Object.keys(AutoRoleSettingsEnum).map(key => ({name: key, value: AutoRoleSettingsEnum[key]})))
        @SlashOption("setting", {
            description: "the name of the setting you wish to change",
        })
            setting: AutoRoleSettingsEnum,
        @SlashOption("value", {
            description: "the value of the setting",
        })
            value: string,
        interaction: CommandInteraction
    ): Promise<void> {
        const guildId = interaction.guild.id;
        const settingObj: AutoRoleSettings = {};
        let str = "";
        switch (setting) {
            // numbers
            case AutoRoleSettingsEnum.MASS_JOIN_PROTECTION:
            case AutoRoleSettingsEnum.MIN_ACCOUNT_AGE: {
                const settingValue = parseInt(value);
                if (isNaN(settingValue)) {
                    return InteractionUtils.replyOrFollowUp(interaction, "Please supply a number");
                }
                if (settingValue <= 0) {
                    str = `${setting} has been disabled`;
                }
                settingObj[setting] = settingValue;
                break;
            }
            // booleans
            case AutoRoleSettingsEnum.AUTO_JAIL:
            case AutoRoleSettingsEnum.AUTO_MUTE:
            case AutoRoleSettingsEnum.PANIC_MODE: {
                settingObj[setting] = value === "true";
                str = `${setting} has been ${value === "true" ? "enabled" : "disabled"}`;
                break;
            }
            // strings
            case AutoRoleSettingsEnum.ROLE:
                str = `${setting} has been bound to the role with id ${value}`;
                settingObj[setting] = value;
                break;
        }
        try {
            await this._closeableModuleManager.getCloseableModule(AutoRole).saveSettings(guildId, settingObj, true);
        } catch (e) {
            return InteractionUtils.replyOrFollowUp(interaction, e.message);
        }
        return InteractionUtils.replyOrFollowUp(interaction, str);
    }


    @Slash("autorole", {
        description: "Get all the auto role settings"
    })
    @SlashGroup("get", "settings")
    @Guard(NotBot, CommandEnabled())
    private async getGlobalSettings(interaction: CommandInteraction): Promise<void> {
        const {guild} = interaction;
        const guildId = guild.id;
        const settings = await this._closeableModuleManager.getCloseableModule(AutoRole).getSettings(guildId);
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
                    value = ObjectUtil.timeToHuman(value, TimeUtils.TIME_UNIT.days);
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
