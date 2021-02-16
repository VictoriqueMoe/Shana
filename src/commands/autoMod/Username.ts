import {BaseDAO, UniqueViolationError} from "../../DAO/BaseDAO";
import {UsernameModel} from "../../model/DB/autoMod/Username.model";
import {Command, CommandMessage, Description, Guard} from "@typeit/discord";
import {NotBot} from "../../guards/NotABot";
import {roleConstraints} from "../../guards/RoleConstraint";
import {BlockGuard} from "../../guards/BlockGuard";
import {Roles} from "../../enums/Roles";
import {StringUtils} from "../../utils/Utils";
import {GuildMember} from "discord.js";
import RolesEnum = Roles.RolesEnum;

export abstract class Username extends BaseDAO<UsernameModel> {

    @Command("viewUsernames")
    @Description(Username.viewDescriptionForSetUsernames())
    @Guard(NotBot, roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE), BlockGuard)
    private async ViewAllSetUsernames(command: CommandMessage): Promise<void> {
        let allModels = await UsernameModel.findAll();
        let guild = command.guild;
        if (allModels.length === 0) {
            command.reply("No members in the database");
            return;
        }
        let message = `\n`;
        for (let model of allModels) {
            let member = await guild.members.fetch(model.userId);
            message += `\n user: "${member.user.username}" has a persisted username of "${model.usernameToPersist}"`;
            if (model.force) {
                message += ` Additionally, this user is not allowed to change it`;
            }
        }
        command.reply(message);
    }

    @Command("removeUsername")
    @Description(Username.removeDescriptionForSetUsername())
    @Guard(NotBot, roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE), BlockGuard)
    private async removeSetUsername(command: CommandMessage): Promise<void> {
        let argumentArray = StringUtils.splitCommandLine(command.content);
        if (argumentArray.length !== 1) {
            command.reply('Invalid arguments, please supply <"username">');
            return;
        }
        let mentionMembers = command.mentions.members;
        if (mentionMembers.size != 1) {
            command.reply('Invalid arguments, Please supply ONE user in your arguments');
            return;
        }
        let mentionMember = mentionMembers.values().next().value as GuildMember;
        let userId = mentionMember.id;
        let rowCount = await UsernameModel.destroy({
            where: {
                userId
            }
        });
        rowCount === 1 ? command.reply("Member remove from Database") : command.reply("Member not found in database");
    }

    @Command("username")
    @Description(Username.getDescriptionForSetUsername())
    @Guard(NotBot, roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE), BlockGuard)
    private async setUsername(command: CommandMessage): Promise<void> {
        let argumentArray = StringUtils.splitCommandLine(command.content);
        if (argumentArray.length !== 2 && argumentArray.length !== 3) {
            command.reply('Invalid arguments, please supply <"username"> <"new username"> [block change]');
            return;
        }
        let [, usernameToPersist] = argumentArray;
        let force = false;
        if (argumentArray.length === 3) {
            force = (argumentArray[2] == 'true');
        }
        let mentionMembers = command.mentions.members;
        if (mentionMembers.size != 1) {
            command.reply('Invalid arguments, Please supply ONE user in your arguments');
            return;
        }
        let mentionMember = mentionMembers.values().next().value as GuildMember;
        let vicBotRole = await Roles.getRole(RolesEnum.WEEB_OVERLORD);
        let roleOfMember = mentionMember.roles.highest;
        if (roleOfMember.position > vicBotRole.position) {
            command.reply("You can not use this command against a member who's highest role is above this bots highest role");
            return;
        }
        if(roleOfMember.position >= command.member.roles.highest.position){
            command.reply("You can not use this command against a member who's role is higher than yours!");
            return;
        }
        let userId = mentionMember.id;
        let obj = {
            userId,
            usernameToPersist,
            force
        };

        let model = new UsernameModel(obj);
        try {
            await super.commitToDatabase(model, undefined, true);
        } catch (e) {
            if (e instanceof UniqueViolationError) {
                await UsernameModel.update(
                    {
                        usernameToPersist,
                        force
                    },
                    {
                        where: {
                            userId
                        }
                    }
                );
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