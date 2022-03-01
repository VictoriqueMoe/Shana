import {Client, DefaultPermissionResolver, Discord, Guard, Permission, Slash, SlashGroup} from "discordx";
import {AbstractCommandModule} from "../AbstractCommandModule";
import {NotBotInteraction} from "../../guards/NotABot";
import {CommandEnabled} from "../../guards/CommandEnabled";
import {CommandInteraction} from "discord.js";
import {delay, inject, injectable} from "tsyringe";
import {MuteManager} from "../../model/guild/manager/MuteManager";
import {ArrayUtils, DiscordUtils, ObjectUtil} from "../../utils/Utils";
import {Category} from "@discordx/utilities";
import {CommandSecurityManager} from "../../model/guild/manager/CommandSecurityManager";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@Category("Secure", "secured commands used as moderation utilities")
@Category("Secure", [
    {
        "name": "mutes",
        "type": "SLASH",
        "description": "Get a list of all mutes",
        options: []
    }
])
@Permission(new DefaultPermissionResolver(AbstractCommandModule.getDefaultPermissionAllow))
@Permission(AbstractCommandModule.getPermissions)
@SlashGroup({
    name: "secure",
    description: "secured commands used as moderation utilities",
})
@SlashGroup("secure")
@injectable()
export class SecuredCommands extends AbstractCommandModule {

    constructor(
        private _muteManager: MuteManager,
        @inject(delay(() => CommandSecurityManager)) private _commandSecurityManager: CommandSecurityManager,
        private _client: Client
    ) {
        super();
    }

    @Slash("mutes", {
        description: "Get a list of all mutes"
    })
    @Guard(NotBotInteraction, CommandEnabled())
    private async mutes(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        const allMutes = await this._muteManager.getAllMutedMembers(interaction.guildId);
        let retStr = "";
        if (!ArrayUtils.isValidArray(allMutes)) {
            retStr = "No members are currently muted";
        }
        for (const mutedMember of allMutes) {
            const {communicationDisabledUntilTimestamp} = mutedMember;
            const timeLeft = Math.abs(Date.now() - communicationDisabledUntilTimestamp);
            const timeLeftHuman = ObjectUtil.timeToHuman(timeLeft);
            retStr += `<@${mutedMember.id}> (${mutedMember.user.tag}) mute expires on: <t:${communicationDisabledUntilTimestamp}:F> (in ${timeLeftHuman})\n`;
        }
        InteractionUtils.replyOrFollowUp(interaction, retStr);
    }

    @Slash("initservercommandpermissions", {
        description: "Re-init all command permissions for this server"
    })
    @Guard(NotBotInteraction, CommandEnabled())
    private async initServerCommandPermissions(
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        await this._commandSecurityManager.initGuildApplicationPermissions(interaction.guild);
        InteractionUtils.replyOrFollowUp(interaction, "Permissions synchronised");
    }

}
