import {DefaultPermissionResolver, Discord, Guard, Permission, Slash, SlashOption} from "discordx";
import {ArrayUtils, DiscordUtils} from "../../utils/Utils.js";
import {CommandEnabled} from "../../guards/CommandEnabled.js";
import {AbstractCommandModule} from "../AbstractCommandModule.js";
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
    },
    {
        "name": "getAllEnabled",
        "type": "SLASH",
        "options": [],
        "description": "Get the enabled status for modules"
    }
])
@Permission(new DefaultPermissionResolver(AbstractCommandModule.getDefaultPermissionAllow))
@Permission(AbstractCommandModule.getPermissions)
export abstract class ModuleEngine extends AbstractCommandModule {

    @Slash("getallenabled", {
        description: "Get the enabled status for modules"
    })
    @Guard(CommandEnabled)
    private async getAllEnabled(
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        const guildId = interaction.guild.id;
        const allModuleNames = await DiscordUtils.getAllClosableModules(guildId);
        const enabled = allModuleNames.filter(module => module.status);
        if (!ArrayUtils.isValidArray(enabled)) {
            return InteractionUtils.replyOrFollowUp(interaction, "No modules enabled");
        }
        return InteractionUtils.replyOrFollowUp(interaction, `The following modules are enabled:\n${enabled.map(module => module.moduleId).join("\n")}`);
    }

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
        const ids = allModuleNames.map(module => module.moduleId);
        if (!ids.includes(moduleId)) {
            return InteractionUtils.replyOrFollowUp(interaction, `Unable to find that module, all available modules are: \n ${ids.join(", ")}`);
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
        const ids = allModuleNames.map(module => module.moduleId);
        InteractionUtils.replyOrFollowUp(interaction, `all available modules are: \n ${ids.join(", ")}`);
    }
}