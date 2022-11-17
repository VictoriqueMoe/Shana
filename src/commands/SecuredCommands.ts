import {Client, Discord, Guard, Slash, SlashGroup, SlashOption} from "discordx";
import {MuteManager} from "../model/framework/manager/MuteManager.js";
import {NotBot} from "@discordx/utilities";
import {DiscordUtils, ObjectUtil} from "../utils/Utils.js";
import {ApplicationCommandOptionType, CommandInteraction, PermissionsBitField} from "discord.js";
import {injectable} from "tsyringe";
import {RoleManager} from "../model/framework/manager/RoleManager.js";
import {PermissionFlagsBits} from "discord-api-types/v10.js";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@SlashGroup({
    name: "secure",
    description: "secured commands used as moderation utilities",
    defaultMemberPermissions: [PermissionsBitField.Flags.ManageRoles, PermissionsBitField.Flags.MuteMembers, PermissionsBitField.Flags.ManageChannels],
    dmPermission: false
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
        name: "delete_channels",
        description: "delete all channels with this string",
    })
    @Guard(NotBot)
    private async deleteChannels(
        @SlashOption({
            name: "contains",
            type: ApplicationCommandOptionType.String,
            description: "the string to include to find the channels",
            required: true
        })
            channelStr: string,
        interaction: CommandInteraction
    ): Promise<void> {
        const channelsToDelete = interaction.guild.channels.cache.filter(channel => channel.name.includes(channelStr));
        const me = interaction.guild.members.me;
        let num = 0;
        for (const [, channel] of channelsToDelete) {
            const channelPermissions = channel.permissionsFor(me, true);
            const canDelete = channelPermissions.has(PermissionFlagsBits.ManageChannels);
            if (!canDelete) {
                continue;
            }
            await channel.delete();
            num++;
        }
        return InteractionUtils.replyOrFollowUp(interaction, `${num} channels delete`);
    }

    @Slash({
        description: "Get a list of all mutes",
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
