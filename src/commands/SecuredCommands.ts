import {Client, Discord, Guard, Slash, SlashGroup} from "discordx";
import {MuteManager} from "../model/framework/manager/MuteManager.js";
import {NotBot} from "@discordx/utilities";
import {DiscordUtils, ObjectUtil} from "../utils/Utils.js";
import {CommandInteraction, PermissionsBitField} from "discord.js";
import {injectable} from "tsyringe";
import {RoleManager} from "../model/framework/manager/RoleManager.js";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@SlashGroup({
    name: "secure",
    description: "secured commands used as moderation utilities",
})
@SlashGroup("secure")
@injectable()
export class SecuredCommands {

    public constructor(
        private _muteManager: MuteManager,
        private _client: Client,
        private _roleManager: RoleManager
    ) {
    }

    @Slash({
        name: "no_roles",
        description: "Get a list of all members with no roles",
        defaultMemberPermissions: PermissionsBitField.Flags.ManageRoles
    })
    @Guard(NotBot)
    private async noRoles(interaction: CommandInteraction): Promise<void> {
        const members = await this._roleManager.getMembersWithNoRoles(interaction.guildId);
        const replyStr = ObjectUtil.isValidArray(members) ? members.join(", ") : "Everyone has a role";
        InteractionUtils.replyOrFollowUp(interaction, {
            content: replyStr,
            ephemeral: true
        });
    }

    @Slash({
        description: "Get a list of all mutes",
        defaultMemberPermissions: PermissionsBitField.Flags.MuteMembers
    })
    @Guard(NotBot)
    private async mutes(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        const allMutes = await this._muteManager.getAllMutedMembers(interaction.guildId);
        let retStr = "";
        if (!ObjectUtil.isValidArray(allMutes)) {
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

}
