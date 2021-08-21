import {Discord, DIService, Guard, SimpleCommand, SimpleCommandMessage} from "discordx";
import {NotBot} from "../../guards/NotABot";
import {ObjectUtil, StringUtils} from "../../utils/Utils";
import {SettingsManager} from "../../model/settings/SettingsManager";
import {DEFAULT_SETTINGS, SETTINGS} from "../../enums/SETTINGS";
import {secureCommand} from "../../guards/RoleConstraint";
import {ICloseableModule} from "../../model/closeableModules/ICloseableModule";
import {AutoRoleSettings} from "../../model/closeableModules/AutoRoleSettings";
import {AutoRole} from "../../events/closeableModules/autoRole/AutoRole";
import {AbstractCommandModule} from "../AbstractCommandModule";


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
                },
                {
                    name: "AutoRoleMinAccountAge",
                    description: {
                        text: "Set the minimum age of the account joining needs to be before they awre allowed to see the rest of the server\nIf an account joins before this age, then they are placed in jail until the account is old enough\nThis requires 'JailRole' to be set\n set to -1 to disable",
                        args: [{
                            name: "value",
                            description: "number in days of limit",
                            optional: false,
                            type: "number"
                        }]
                    }
                },
                {
                    name: "AutoAutoJail",
                    description: {
                        text: "If set to true then users will automatically be re-jailed if they leave the server while in jail and return",
                        args: [{
                            name: "enabled",
                            description: "true or false",
                            optional: false,
                            type: "boolean"
                        }]
                    }
                },
                {
                    name: "AutoRoleAutoMute",
                    description: {
                        text: "If set to true, then members will automatically be muted if they leave as mute and rejoin as long as the mute is still active",
                        args: [{
                            name: "enabled",
                            description: "true or false",
                            optional: false,
                            type: "boolean"
                        }]
                    }
                },
                {
                    name: "panicMode",
                    description: {
                        text: "Enabling this will auto apply the 'unverified' role to everyone who joins",
                        args: [{
                            name: "enabled",
                            description: "true or false",
                            optional: false,
                            type: "boolean"
                        }]
                    }
                },
                {
                    name: "massJoinProtection",
                    description: {
                        text: "Set the mac mass joins in 10 seconds, if this is limit is hit, then panicMode is enabled",
                        args: [{
                            name: "value",
                            description: "number of joins in 10 seconds",
                            optional: false,
                            type: "number"
                        }]
                    }
                }
            ]
        });
    }

    @SimpleCommand("AutoRoleAutoMute")
    @Guard(NotBot, secureCommand)
    private async AutoRoleAutoMute({message}: SimpleCommandMessage): Promise<void> {
        const argumentArray = StringUtils.splitCommandLine(message.content);
        if (argumentArray.length !== 1) {
            message.reply("Please supply true or false");
            return;
        }
        const autoMute = argumentArray[0] === "true";
        const autoRole: ICloseableModule<AutoRoleSettings> = DIService.instance.getService(AutoRole);
        const setting = {
            autoMute
        };
        try {
            await autoRole.saveSettings(message.guild.id, setting, true);
        } catch (e) {
            message.reply(e.message);
            return;
        }
        message.reply("Setting saved");
    }

    @SimpleCommand("AutoAutoJail")
    @Guard(NotBot, secureCommand)
    private async AutoAutoJail({message}: SimpleCommandMessage): Promise<void> {
        const argumentArray = StringUtils.splitCommandLine(message.content);
        if (argumentArray.length !== 1) {
            message.reply("Please supply true or false");
            return;
        }
        const autoJail = argumentArray[0] === "true";
        const autoRole: ICloseableModule<AutoRoleSettings> = DIService.instance.getService(AutoRole);
        const setting = {
            autoJail
        };
        try {
            await autoRole.saveSettings(message.guild.id, setting, true);
        } catch (e) {
            message.reply(e.message);
            return;
        }
        message.reply("Setting saved");
    }

    @SimpleCommand("AutoRoleMinAccountAge")
    @Guard(NotBot, secureCommand)
    private async AutoRoleMinAccountAge({message}: SimpleCommandMessage): Promise<void> {
        const argumentArray = StringUtils.splitCommandLine(message.content);
        if (argumentArray.length !== 1) {
            message.reply("Please supply a number");
            return;
        }
        const minAccountAge = parseInt(argumentArray[0]);
        if (isNaN(minAccountAge)) {
            message.reply("Please supply a number");
            return;
        }
        const autoRole: ICloseableModule<AutoRoleSettings> = DIService.instance.getService(AutoRole);
        const setting = {
            minAccountAge
        };
        try {
            await autoRole.saveSettings(message.guild.id, setting, true);
        } catch (e) {
            message.reply(e.message);
            return;
        }
        message.reply("Setting saved");
    }

    @SimpleCommand("prefix")
    @Guard(NotBot, secureCommand)
    private async setPrefix({message}: SimpleCommandMessage): Promise<void> {
        const argumentArray = StringUtils.splitCommandLine(message.content);
        if (argumentArray.length !== 1 && argumentArray.length !== 0) {
            message.reply("Please supply one or zero argument(s) only");
            return;
        }
        const [prefix] = argumentArray;
        if (ObjectUtil.isNumeric(prefix)) {
            message.reply("Prefix can not be a number");
            return;
        }
        if (!ObjectUtil.validString(prefix)) {
            await SettingsManager.instance.saveOrUpdateSetting(SETTINGS.PREFIX, DEFAULT_SETTINGS.PREFIX, message.guild.id);
            message.reply(`Prefix has been reset to "${DEFAULT_SETTINGS.PREFIX}"`);
        } else {
            await SettingsManager.instance.saveOrUpdateSetting(SETTINGS.PREFIX, prefix, message.guild.id);
            message.reply(`Prefix has been changed to "${prefix}"`);
        }
    }

    @SimpleCommand("panicMode")
    @Guard(NotBot, secureCommand)
    private async panicMode({message}: SimpleCommandMessage): Promise<void> {
        const argumentArray = StringUtils.splitCommandLine(message.content);
        if (argumentArray.length !== 1) {
            message.reply("Please supply true or false");
            return;
        }
        const panicMode = argumentArray[0] === "true";
        const autoRole: ICloseableModule<AutoRoleSettings> = DIService.instance.getService(AutoRole);
        const setting = {
            panicMode
        };
        try {
            await autoRole.saveSettings(message.guild.id, setting, true);
        } catch (e) {
            message.reply(e.message);
            return;
        }
        message.reply("Setting saved");
    }

    @SimpleCommand("massJoinProtection")
    @Guard(NotBot, secureCommand)
    private async massJoinProtection({message}: SimpleCommandMessage): Promise<void> {
        const argumentArray = StringUtils.splitCommandLine(message.content);
        if (argumentArray.length !== 1) {
            message.reply("Please supply a number");
            return;
        }
        const massJoinProtection = parseInt(argumentArray[0]);
        if (isNaN(massJoinProtection)) {
            message.reply("Please supply a number");
            return;
        }
        const autoRole: ICloseableModule<AutoRoleSettings> = DIService.instance.getService(AutoRole);
        const setting = {
            massJoinProtection
        };
        try {
            await autoRole.saveSettings(message.guild.id, setting, true);
        } catch (e) {
            message.reply(e.message);
            return;
        }
        message.reply("Setting saved");
    }
}