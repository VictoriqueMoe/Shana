import {Command, CommandMessage, Description, Guard} from "@typeit/discord";
import {AdminOnlyTask} from "../guards/AdminOnlyTask";
import {DiscordUtils, StringUtils} from "../utils/Utils";

export abstract class ModuleEngine {

    @Command("enableModule")
    @Description(ModuleEngine.getEnableModuleDescription())
    @Guard(AdminOnlyTask)
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
}