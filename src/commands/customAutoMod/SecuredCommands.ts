import type {Client} from "discordx";
import {DefaultPermissionResolver, Discord, Guard, Permission, Slash, SlashGroup} from "discordx";
import {AbstractCommand} from "../AbstractCommand";
import {NotBot} from "@discordx/utilities";
import {CommandEnabled} from "../../guards/CommandEnabled";
import type {CommandInteraction} from "discord.js";
import {delay, inject, injectable} from "tsyringe";
import type {MuteManager} from "../../model/framework/manager/MuteManager";
import {ArrayUtils, DiscordUtils, ObjectUtil} from "../../utils/Utils";
import {Category} from "../../modules/category";
import {CommandSecurityManager} from "../../model/framework/manager/CommandSecurityManager";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@Category("Secure", "secured commands used as moderation utilities")
@Category("Secure", [
    {
        "name": "mutes",
        "type": "SLASH",
        "description": "Get a list of all mutes",
        options: []
    },
    {
        "name": "no_roles",
        "type": "SLASH",
        "description": "Get a list of all members with no roles",
        options: []
    }
])
@Permission(new DefaultPermissionResolver(AbstractCommand.getDefaultPermissionAllow))
@Permission(AbstractCommand.getPermissions)
@SlashGroup({
    name: "secure",
    description: "secured commands used as moderation utilities",
})
@SlashGroup("secure")
@injectable()
export class SecuredCommands extends AbstractCommand {

    constructor(
        private _muteManager: MuteManager,
        @inject(delay(() => CommandSecurityManager)) private _commandSecurityManager: CommandSecurityManager,
        private _client: Client
    ) {
        super();
    }

    @Slash("no_roles", {
        description: "Get a list of all members with no roles"
    })
    @Guard(NotBot, CommandEnabled())
    private async noRoles(interaction: CommandInteraction): Promise<void> {
        const members = await DiscordUtils.getMembersWithNoRoles(interaction.guildId);
        const replyStr = ArrayUtils.isValidArray(members) ? members.join(", ") : "Everyone has a role";
        InteractionUtils.replyOrFollowUp(interaction, replyStr, true);
    }

    @Slash("mutes", {
        description: "Get a list of all mutes"
    })
    @Guard(NotBot, CommandEnabled())
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
    @Guard(NotBot, CommandEnabled())
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
