import {UsernameModel} from "../../model/DB/autoMod/impl/Username.model";
import {DefaultPermissionResolver, Discord, Guard, Permission, Slash, SlashGroup, SlashOption} from "discordx";
import {NotBot} from "@discordx/utilities";
import {CommandEnabled} from "../../guards/CommandEnabled";
import {DiscordUtils} from "../../utils/Utils";
import {CommandInteraction, GuildMember, User} from "discord.js";
import {GuildManager} from "../../model/guild/manager/GuildManager";
import {AbstractCommand} from "../AbstractCommand";
import {container} from "tsyringe";
import {Category} from "../../modules/category";
import {getRepository} from "typeorm";
import {BaseDAO} from "../../DAO/BaseDAO";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@Category("Username", "Commands to set usernames for people")
@Category("Username", [
    {
        name: "viewUsernames",
        description: "View all the persisted usernames this bot is aware of",
        type: "SLASH",
        options: []
    },
    {
        name: "username",
        description: "Force a username to always be set to a member, this will automatically apply the username if they leave and rejoin again.\n\nyou can optionally add a block to anyone other than staff member from changing it.\n\nWipe the username to clear it from the block",
        type: "SLASH",
        options: [
            {
                name: "User",
                type: "USER",
                optional: false,
                description: "The user you want to change nicknames"
            },
            {
                name: "new nickName",
                type: "STRING",
                optional: false,
                description: "The new nickname for the user"
            },
            {
                name: "Block changes",
                type: "BOOLEAN",
                optional: true,
                description: "Block this username from being changed by another other than staff members (as defined in the staff members config)"
            }
        ]
    }
])
@Permission(new DefaultPermissionResolver(AbstractCommand.getDefaultPermissionAllow))
@Permission(AbstractCommand.getPermissions)
@SlashGroup({
    name: "username",
    description: "Commands to set usernames for people",
})
@SlashGroup("username")
export abstract class Username extends AbstractCommand {

    @Slash("viewusernames", {
        description: "View all the persisted usernames this bot is aware of"
    })
    @Guard(NotBot, CommandEnabled())
    private async ViewAllSetUsernames(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        const {guild} = interaction;
        const guildId = guild.id;
        const allModels = await getRepository(UsernameModel).find({
            where: {
                guildId
            }
        });
        if (allModels.length === 0) {
            InteractionUtils.replyOrFollowUp(interaction, "No members in the database");
            return;
        }
        let messageDisplay = `\n`;
        for (const model of allModels) {
            try {
                const member = await guild.members.fetch(model.userId);
                messageDisplay += `\n user: "${member.user.tag}" has a persisted username of "${model.usernameToPersist}"`;
                if (model.force) {
                    messageDisplay += ` Additionally, this user is not allowed to change it`;
                }
            } catch {

            }
        }
        InteractionUtils.replyOrFollowUp(interaction, messageDisplay);
    }

    @Slash("username", {
        description: "force a username to always be set to a member"
    })
    @Guard(NotBot, CommandEnabled())
    private async setUsername(
        @SlashOption("user", {
            description: "The user you want to change nickname"
        })
            mentionedMember: User,
        @SlashOption("newnickname", {
            description: "The new nickname for the user"
        })
            usernameToPersist: string,
        @SlashOption("blockchanges", {
            description: "Block this username from being changed by another other than staff members",
            required: false
        })
            force: boolean = false,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply();
        if (!(mentionedMember instanceof GuildMember)) {
            return InteractionUtils.replyOrFollowUp(interaction, "Unable to find user", false);
        }
        const guildId = interaction.guild.id;
        const guildManager = container.resolve(GuildManager);
        const guild = await guildManager.getGuild(guildId);
        const bot = await DiscordUtils.getBot(guild.id);
        const botHighestRole = bot.roles.highest;
        const roleOfMember = mentionedMember.roles.highest;
        if (roleOfMember.position > botHighestRole.position) {
            return InteractionUtils.replyOrFollowUp(interaction, "You can not use this command against a member who's highest role is above this bots highest role", false);
        }
        const callee = InteractionUtils.getInteractionCaller(interaction);
        if (!(callee instanceof GuildMember)) {
            return InteractionUtils.replyOrFollowUp(interaction, "Internal Error", false);
        }
        if (roleOfMember.position >= callee.roles.highest.position) {
            return InteractionUtils.replyOrFollowUp(interaction, "You can not use this command against a member who's role is higher than yours!", false);
        }
        const repo = getRepository(UsernameModel);
        const userId = mentionedMember.id;
        if (await repo.count({
            where: {
                userId,
                guildId
            }
        }) > 0) {
            await repo.update(
                {
                    userId,
                    guildId
                },
                {
                    usernameToPersist,
                    force
                }
            );
        } else {
            const obj = {
                userId,
                usernameToPersist,
                force,
                guildId
            };

            const model = BaseDAO.build(UsernameModel, obj);
            try {
                await repo.save(model);
            } catch (e) {
            }
        }
        await mentionedMember.setNickname(usernameToPersist);
        InteractionUtils.replyOrFollowUp(interaction, `user ${mentionedMember.user.username} has been persisted to always be "${usernameToPersist}"`);
    }
}
