import {Command, CommandMessage, Description, Guard} from "@typeit/discord";
import {DiscordUtils, StringUtils} from "../utils/Utils";
import {roleConstraints} from "../guards/RoleConstraint";
import {Roles} from "../enums/Roles";
import RolesEnum = Roles.RolesEnum;

export abstract class ModuleEngine {

    @Command("dynoReplace")
    @Description(ModuleEngine.getEnableDynoReplaceDescription())
    @Guard(roleConstraints(RolesEnum.OVERWATCH_ELITE))
    private async dynoReplace(command: CommandMessage): Promise<void> {
        const argumentArray = StringUtils.splitCommandLine(command.content);
        if (argumentArray.length !== 1) {
            command.reply(`Command arguments wrong, usage: ~enableModule <"enable">`);
            return;
        }
        const isEnable = argumentArray[0].toLowerCase() === "true";
        const dynoModules = DiscordUtils.getDynoReplacementModules();
        for (const module of dynoModules) {
            isEnable ? await module.open() : await module.close();
        }
        const modulesEnabled = dynoModules.map(d => d.moduleId);
        const str = `the following modules have been ${isEnable ? "enabled" : "disabled"}: \n ${modulesEnabled.join(", ")}`;
        command.reply(str);
    }

    @Command("enableModule")
    @Description(ModuleEngine.getEnableModuleDescription())
    @Guard(roleConstraints(RolesEnum.OVERWATCH_ELITE))
    private async enableModule(command: CommandMessage): Promise<void> {
        const argumentArray = StringUtils.splitCommandLine(command.content);
        if (argumentArray.length !== 2) {
            command.reply(`Command arguments wrong, usage: ~enableModule <"moduleId"> <"enable">`);
            return;
        }
        const moduleId = argumentArray[0];
        const isEnable = argumentArray[1].toLowerCase() === "true";
        const allModuleNames = await DiscordUtils.getAllClosableModules();
        if (!allModuleNames.includes(moduleId)) {
            command.reply(`Unable to find that module, all available modules are: \n ${allModuleNames.join(", ")}`);
            return;
        }
        const module = DiscordUtils.getModule(moduleId);
        if (isEnable) {
            const didOpen = await module.open();
            didOpen ? command.reply(`module ${moduleId} has been enabled`) : command.reply(`module ${moduleId} can not be enabled`);
        } else {
            const didClose = await module.close();
            didClose ? command.reply(`module ${moduleId} has been disabled`) : command.reply(`module ${moduleId} can not be disabled`);
        }

    }

    private static getEnableModuleDescription() {
        return '\n enable a module \n usage: ~enableModule <"moduleId"> <"enable"> \n example: ~enableModule "autoRole" "false" will disable the auto role module';
    }

    private static getEnableDynoReplaceDescription() {
        return '\n enable all the modules needed to replace dyno functionality (curreonly only supports user join/leave/ban logging and auto role) \n usage: ~dynoReplace <"enable"> \n example: ~dynoReplace "true"';
    }
}