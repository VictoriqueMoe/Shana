import {DefaultPermissionResolver, Discord, Guard, Permission, Slash, SlashOption} from "discordx";
import {DiscordUtils} from "../../utils/Utils";
import {CommandEnabled} from "../../guards/CommandEnabled";
import {AbstractCommandModule} from "../AbstractCommandModule";
import {CommandInteraction} from "discord.js";
import {Category} from "@discordx/utilities";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@Category("closeableModules", "Commands to enable or disable features")
@Category("closeableModules", [
    {
        "name": "enableModule",
        "type": "SLASH",
        "options": [
            {
                "name": "moduleId",
                "description": "the name of the module to close or open, Please run 'getModuleNames' to get a list of module names for this argument",
                "optional": false,
                "type": "STRING"
            },
            {
                "name": "enable/Disable",
                "description": "true = enable, false = disable",
                "optional": false,
                "type": "BOOLEAN"
            }
        ],
        "description": "Enable a module to run. These modules are designed to be shut down and started dynamically"
    },
    {
        "name": "getModuleNames",
        "type": "SLASH",
        "options": [],
        "description": "Return a list of all modules to use with the 'enableModule' command"
    }
])
@Permission(new DefaultPermissionResolver(AbstractCommandModule.getDefaultPermissionAllow))
@Permission(AbstractCommandModule.getPermissions)
export abstract class ModuleEngine extends AbstractCommandModule {

    @Slash("enablemodule", {
        description: "Enable a module to run. These modules are designed to be shut down and started dynamically"
    })
    @Guard(CommandEnabled)
    private async enableModule(
        @SlashOption("setting", {
            description: "the name of the module to close or open",
            required: true
        })
            moduleId: string,
        @SlashOption("value", {
            description: "true = enable, false = disable",
            required: true,
            type: "BOOLEAN"
        })
            isEnable: boolean,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply();
        const guildId = interaction.guild.id;
        const allModuleNames = await DiscordUtils.getAllClosableModules(guildId);
        if (!allModuleNames.includes(moduleId)) {
            return InteractionUtils.replyOrFollowUp(interaction, `Unable to find that module, all available modules are: \n ${allModuleNames.join(", ")}`);
        }
        const module = DiscordUtils.getModule(moduleId);
        const subModules = module.submodules.filter(sm => sm.isActive);
        const subModulesStr = (subModules.map(s => s.id)).join(", ");
        if (isEnable) {
            const didOpen = await module.open(guildId);
            didOpen ? InteractionUtils.replyOrFollowUp(interaction, `module ${moduleId} (subModules: ${subModulesStr}) has been enabled`) : InteractionUtils.replyOrFollowUp(interaction, `module ${moduleId} (subModules: ${subModulesStr}) can not be enabled`);
        } else {
            const didClose = await module.close(guildId);
            didClose ? InteractionUtils.replyOrFollowUp(interaction, `module ${moduleId} (subModules: ${subModulesStr}) has been disabled`) : InteractionUtils.replyOrFollowUp(interaction, `module ${moduleId} (subModules: ${subModulesStr}) can not be disabled`);
        }
    }

    @Slash("getmodulenames", {
        description: "Return a list of all modules to use with the 'enableModule' command"
    })
    @Guard(CommandEnabled)
    private async getModuleNames(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        const guildId = interaction.guild.id;
        const allModuleNames = await DiscordUtils.getAllClosableModules(guildId);
        InteractionUtils.replyOrFollowUp(interaction, `all available modules are: \n ${allModuleNames.join(", ")}`);
    }
}