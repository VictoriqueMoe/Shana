import {Discord, Guard, Slash, SlashGroup, SlashOption} from "discordx";
import {Category, NotBot} from "@discordx/utilities";
import {ApplicationCommandOptionType, CommandInteraction, GuildMember, PermissionsBitField, User} from "discord.js";
import {DiscordUtils} from "../../utils/Utils.js";
import {injectable} from "tsyringe";
import {UsernameManager} from "../../model/framework/manager/UsernameManager.js";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@Category("Misc")
@SlashGroup({
    name: "username",
    description: "Commands to set usernames for people",
    defaultMemberPermissions: PermissionsBitField.Flags.ManageNicknames,
    dmPermission: false
})
@SlashGroup("username")
@injectable()
export class Username {

    public constructor(private _usernameManager: UsernameManager) {
    }

    @Slash({
        name: "view_usernames",
        description: "View all the persisted usernames this bot is aware of"
    })
    @Guard(NotBot)
    private async ViewAllSetUsernames(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        const {guild} = interaction;
        const guildId = guild.id;
        const allModels = await this._usernameManager.getAllUsernames(guildId);
        if (allModels.length === 0) {
            InteractionUtils.replyOrFollowUp(interaction, "No members in the database");
            return;
        }
        let messageDisplay = `\n`;
        for (const model of allModels) {
            try {
                const member = await guild.members.fetch(model.userId);
                messageDisplay += `\nuser: "${member.user.tag}" has a persisted username of "${model.usernameToPersist}"`;
                if (model.force) {
                    messageDisplay += ` Additionally, this user is not allowed to change it`;
                }
            } catch {

            }
        }
        InteractionUtils.replyOrFollowUp(interaction, messageDisplay);
    }

    @Slash({
        description: "force a username to always be set to a member"
    })
    @Guard(NotBot)
    private async username(
        @SlashOption({
            name: "user",
            description: "The user you want to change nickname",
            type: ApplicationCommandOptionType.User
        })
            mentionedMember: User,
        @SlashOption({
            name: "new_nickname",
            type: ApplicationCommandOptionType.String,
            description: "The new nickname for the user"
        })
            usernameToPersist: string,
        @SlashOption({
            name: "block_changes",
            type: ApplicationCommandOptionType.Boolean,
            description: "Block this username from being changed by another other than staff members",
            required: false
        })
            force = false,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        if (!(mentionedMember instanceof GuildMember)) {
            return InteractionUtils.replyOrFollowUp(interaction, {
                content: "Unable to find user"
            });
        }
        const guildId = interaction.guild.id;
        const guild = await DiscordUtils.getGuild(guildId);
        const bot = guild.members.me;
        const botHighestRole = bot.roles.highest;
        const roleOfMember = mentionedMember.roles.highest;
        if (roleOfMember.position >= botHighestRole.position) {
            return InteractionUtils.replyOrFollowUp(interaction, "You can not use this command against a member who's highest role is above or the same level as this bots highest role");
        }
        const callee = InteractionUtils.getInteractionCaller(interaction);
        if (!(callee instanceof GuildMember)) {
            return InteractionUtils.replyOrFollowUp(interaction, "Internal Error");
        }
        if (roleOfMember.position >= callee.roles.highest.position) {
            return InteractionUtils.replyOrFollowUp(interaction, "You can not use this command against a member who's role is higher than yours!");
        }
        await this._usernameManager.setUsername(mentionedMember, usernameToPersist, force);
        await mentionedMember.setNickname(usernameToPersist);
        return InteractionUtils.replyOrFollowUp(interaction, `user ${mentionedMember.user.username} has been persisted to always be "${usernameToPersist}"`);
    }
}
