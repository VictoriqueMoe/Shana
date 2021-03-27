import {UsernameModel} from "../../model/DB/autoMod/impl/Username.model";
import {Command, CommandMessage, Description, Guard} from "@typeit/discord";
import {NotBot} from "../../guards/NotABot";
import {roleConstraints} from "../../guards/RoleConstraint";
import {BlockGuard} from "../../guards/BlockGuard";
import {Roles} from "../../enums/Roles";
import {StringUtils} from "../../utils/Utils";
import {GuildMember} from "discord.js";
import {AbstractCommand} from "../AbstractCommand";
import RolesEnum = Roles.RolesEnum;

export abstract class Username extends AbstractCommand<UsernameModel> {

    constructor() {
        super({
            module:{
                name:"Username",
                description: "Commands to set usernames for people"
            },
            commands: [
                {
                    name: "viewUsernames",
                    description: {
                        text: "View all the persisted usernames this bot is aware of"
                    }
                },
                {
                    name: "removeUsername",
                    depricated: true,
                    description: {
                        text: "This command is used to remove and reset the persisted entry. \n this command is the SAME as wiping the username using the discord 'change username' feature and will be removed in the future",
                        args: [
                            {
                                name: "User",
                                type: "mention",
                                optional: false,
                                description: "The member you wish to reset the username for"
                            }
                        ]
                    }
                },
                {
                    name: "username",
                    description: {
                        text: "force a username to always be set to a member, this will automatically apply the username if they leave and rejoin again. \n you can optionally add a block to anyone other than staff member from changing it",
                        examples: ["username @user 'this is a new username' = username will always be 'this is a new username' if they leave and rejoin", "username @user 'this is a new username' true = same as before, but this means they can not change it shemselves"],
                        args: [
                            {
                                name: "User",
                                type: "mention",
                                optional: false,
                                description: "The user you want to change nicknames"
                            },
                            {
                                name: "new nickName",
                                type: "text",
                                optional: false,
                                description: "The new nickname for the user"
                            },
                            {
                                name: "Block changes",
                                type: "boolean",
                                optional: true,
                                description: "Block this username from being changed by another other than staff members (as defined in the staff members config)"
                            }
                        ]
                    }
                }
            ]
        });
    }

    @Command("viewUsernames")
    @Description(Username.viewDescriptionForSetUsernames())
    @Guard(NotBot, roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE), BlockGuard)
    private async ViewAllSetUsernames(command: CommandMessage): Promise<void> {
        const allModels = await UsernameModel.findAll({
            where: {
                guildId: command.guild.id
            }
        });
        const guild = command.guild;
        if (allModels.length === 0) {
            command.reply("No members in the database");
            return;
        }
        let message = `\n`;
        for (const model of allModels) {
            try {
                const member = await guild.members.fetch(model.userId);
                message += `\n user: "${member.user.tag}" has a persisted username of "${model.usernameToPersist}"`;
                if (model.force) {
                    message += ` Additionally, this user is not allowed to change it`;
                }
            } catch {

            }
        }
        command.reply(message);
    }

    @Command("removeUsername")
    @Description(Username.removeDescriptionForSetUsername())
    @Guard(NotBot, roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE), BlockGuard)
    private async removeSetUsername(command: CommandMessage): Promise<void> {
        const argumentArray = StringUtils.splitCommandLine(command.content);
        if (argumentArray.length !== 1) {
            command.reply('Invalid arguments, please supply <"username">');
            return;
        }
        const mentionMembers = command.mentions.members;
        if (mentionMembers.size != 1) {
            command.reply('Invalid arguments, Please supply ONE user in your arguments');
            return;
        }
        const mentionMember = mentionMembers.values().next().value as GuildMember;
        const userId = mentionMember.id;
        const rowCount = await UsernameModel.destroy({
            where: {
                userId,
                guildId: mentionMember.guild.id
            }
        });
        rowCount === 1 ? command.reply("Member remove from Database") : command.reply("Member not found in database");
    }

    @Command("username")
    @Description(Username.getDescriptionForSetUsername())
    @Guard(NotBot, roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE), BlockGuard)
    private async setUsername(command: CommandMessage): Promise<void> {
        const argumentArray = StringUtils.splitCommandLine(command.content);
        if (argumentArray.length !== 2 && argumentArray.length !== 3) {
            command.reply('Invalid arguments, please supply <"username"> <"new username"> [block change]');
            return;
        }
        const [, usernameToPersist] = argumentArray;
        let force = false;
        if (argumentArray.length === 3) {
            force = (argumentArray[2] == 'true');
        }
        const mentionMembers = command.mentions.members;
        if (mentionMembers.size != 1) {
            command.reply('Invalid arguments, Please supply ONE user in your arguments');
            return;
        }
        const mentionMember = mentionMembers.values().next().value as GuildMember;
        const vicBotRole = await Roles.getRole(RolesEnum.WEEB_OVERLORD);
        const roleOfMember = mentionMember.roles.highest;
        if (roleOfMember.position > vicBotRole.position) {
            command.reply("You can not use this command against a member who's highest role is above this bots highest role");
            return;
        }
        if (roleOfMember.position >= command.member.roles.highest.position) {
            command.reply("You can not use this command against a member who's role is higher than yours!");
            return;
        }
        const userId = mentionMember.id;
        if (await UsernameModel.count({
            where: {
                userId,
                guildId: mentionMember.guild.id
            }
        }) > 0) {
            await UsernameModel.update(
                {
                    usernameToPersist,
                    force
                },
                {
                    where: {
                        userId,
                        guildId: mentionMember.guild.id
                    }
                }
            );
        }else{
            const obj = {
                userId,
                usernameToPersist,
                force,
                guildId: mentionMember.guild.id
            };

            const model = new UsernameModel(obj);
            try {
                await super.commitToDatabase(model, undefined, true);
            } catch (e) {
            }
        }
        await mentionMember.setNickname(usernameToPersist);
        command.reply(`user ${mentionMember.user.username} has been persisted to always be "${usernameToPersist}"`);
    }

    private static getDescriptionForSetUsername() {
        return 'Sets the username permanently for a user unless changed by staff \n usage: ~username <"username"> <"new username"> [block change]';
    }

    private static removeDescriptionForSetUsername() {
        return 'remove the username persistence from the database \n usage: ~removeUsername <"username">';
    }

    private static viewDescriptionForSetUsernames() {
        return 'View all the stored usernames in the database \n usage: ~viewUsernames';
    }
}