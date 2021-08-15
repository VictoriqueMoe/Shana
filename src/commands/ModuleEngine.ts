import {CommandMessage, Discord, Guard, SimpleCommand} from "discordx";
import {DiscordUtils, StringUtils} from "../utils/Utils";
import {secureCommand} from "../guards/RoleConstraint";
import {AbstractCommandModule} from "./AbstractCommandModule";

@Discord()
export abstract class ModuleEngine extends AbstractCommandModule<any> {

    constructor() {
        super({
            module: {
                name: "closeableModules",
                description: "Commands to enable or disable features"
            },
            commands: [
                {
                    name: "dynoReplace",
                    description: {
                        text: "Loads all of the modules nessasery for replacing current Dyno functionality",
                        args: [
                            {
                                name: "enable/disable",
                                optional: false,
                                type: "boolean",
                                description: "true = enable, false = disable"
                            }
                        ]
                    }
                },
                {
                    name: "enableModule",
                    description: {
                        text: "Enable a module to run. These modules are designed to be shut down and started dynamically",
                        examples: ["enableModule AdminLog true = enable module AdminLog", "enableModule AdminLog false = disable module AdminLog"],
                        args: [
                            {
                                name: "moduleId",
                                type: "text",
                                optional: false,
                                description: "the name of the module to close or open, Please run 'getModuleNames' to get a list of module names for this argument"
                            },
                            {
                                name: "enable/Disable",
                                type: "boolean",
                                optional: false,
                                description: "true = enable, false = disable"
                            }
                        ]
                    }
                },
                {
                    name: "getModuleNames",
                    description: {
                        text: "Return a list of all modules to use with the 'enableModule' command"
                    }
                }
            ]
        });
    }

    private static getEnableModuleDescription() {
        return '\n enable a module \n usage: ~enableModule <"moduleId"> <"enable"> \n example: ~enableModule "autoRole" "false" will disable the auto role module';
    }

    private static getEnableDynoReplaceDescription() {
        return '\n enable all the modules needed to replace dyno functionality (curreonly only supports user join/leave/ban logging and auto role) \n usage: ~dynoReplace <"enable"> \n example: ~dynoReplace "true"';
    }

    @SimpleCommand("dynoReplace")
    @Guard(secureCommand)
    private async dynoReplace(command: CommandMessage): Promise<void> {
        const argumentArray = StringUtils.splitCommandLine(command.content);
        if (argumentArray.length !== 1) {
            command.reply(`Command arguments wrong, usage: ~enableModule <"enable">`);
            return;
        }
        const isEnable = argumentArray[0].toLowerCase() === "true";
        const dynoModules = DiscordUtils.getDynoReplacementModules();
        for (const module of dynoModules) {
            isEnable ? await module.open(command.guild.id) : await module.close(command.guild.id);
        }
        const modulesEnabled = dynoModules.map(d => {
            const subModules = d.submodules.filter(sm => sm.isActive);
            return subModules.size > 0 ? `${d.moduleId} (subModules: ${(subModules.map(s => s.id)).join(", ")})` : d.moduleId;
        });
        const str = `the following modules have been ${isEnable ? "enabled" : "disabled"}: \n ${modulesEnabled.join("\n ")}`;
        command.reply(str);
    }

    @SimpleCommand("enableModule")
    @Guard(secureCommand)
    private async enableModule(command: CommandMessage): Promise<void> {
        const argumentArray = StringUtils.splitCommandLine(command.content);
        if (argumentArray.length !== 2) {
            command.reply(`Command arguments wrong, usage: ~enableModule <"moduleId"> <"enable">`);
            return;
        }
        const moduleId = argumentArray[0];
        const isEnable = argumentArray[1].toLowerCase() === "true";
        const allModuleNames = await DiscordUtils.getAllClosableModules(command.guild.id);
        if (!allModuleNames.includes(moduleId)) {
            command.reply(`Unable to find that module, all available modules are: \n ${allModuleNames.join(", ")}`);
            return;
        }
        const module = DiscordUtils.getModule(moduleId);
        const subModules = module.submodules.filter(sm => sm.isActive);
        const subModulesStr = (subModules.map(s => s.id)).join(", ");
        if (isEnable) {
            const didOpen = await module.open(command.guild.id);
            didOpen ? command.reply(`module ${moduleId} (subModules: ${subModulesStr}) has been enabled`) : command.reply(`module ${moduleId} (subModules: ${subModulesStr}) can not be enabled`);
        } else {
            const didClose = await module.close(command.guild.id);
            didClose ? command.reply(`module ${moduleId} (subModules: ${subModulesStr}) has been disabled`) : command.reply(`module ${moduleId} (subModules: ${subModulesStr}) can not be disabled`);
        }
    }

    @SimpleCommand("getModuleNames")
    @Guard(secureCommand)
    private async getModuleNames(command: CommandMessage): Promise<void> {
        const allModuleNames = await DiscordUtils.getAllClosableModules(command.guild.id);
        command.reply(`all available modules are: \n ${allModuleNames.join(", ")}`);
    }
}