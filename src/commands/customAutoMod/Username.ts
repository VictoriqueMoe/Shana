import {UsernameModel} from "../../model/DB/autoMod/impl/Username.model";
import {Discord, Guard, SimpleCommand, SimpleCommandMessage} from "discordx";
import {NotBot} from "../../guards/NotABot";
import {secureCommand} from "../../guards/RoleConstraint";
import {DiscordUtils, StringUtils} from "../../utils/Utils";
import {GuildMember} from "discord.js";
import {GuildManager} from "../../model/guild/manager/GuildManager";
import {AbstractCommandModule} from "../AbstractCommandModule";

@Discord()
export abstract class Username extends AbstractCommandModule<UsernameModel> {

    constructor() {
        super({
            module: {
                name: "Username",
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
                    deprecated: true,
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


    @SimpleCommand("viewUsernames")
    @Guard(NotBot, secureCommand)
    private async ViewAllSetUsernames({message}: SimpleCommandMessage): Promise<void> {
        const allModels = await UsernameModel.findAll({
            where: {
                guildId: message.guild.id
            }
        });
        const guild = message.guild;
        if (allModels.length === 0) {
            message.reply("No members in the database");
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
        message.reply(messageDisplay);
    }

    @SimpleCommand("removeUsername")
    @Guard(NotBot, secureCommand)
    private async removeSetUsername({message}: SimpleCommandMessage): Promise<void> {
        const argumentArray = StringUtils.splitCommandLine(message.content);
        if (argumentArray.length !== 1) {
            message.reply('Invalid arguments, please supply <"username">');
            return;
        }
        const mentionMembers = message.mentions.members;
        if (mentionMembers.size != 1) {
            message.reply('Invalid arguments, Please supply ONE user in your arguments');
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
        rowCount === 1 ? message.reply("Member remove from Database") : message.reply("Member not found in database");
    }

    @SimpleCommand("username")
    @Guard(NotBot, secureCommand)
    private async setUsername({message}: SimpleCommandMessage): Promise<void> {
        const argumentArray = StringUtils.splitCommandLine(message.content);
        if (argumentArray.length !== 2 && argumentArray.length !== 3) {
            message.reply('Invalid arguments, please supply <"username"> <"new username"> [block change]');
            return;
        }
        const [, usernameToPersist] = argumentArray;
        let force = false;
        if (argumentArray.length === 3) {
            force = (argumentArray[2] == 'true');
        }
        const mentionMembers = message.mentions.members;
        if (mentionMembers.size != 1) {
            message.reply('Invalid arguments, Please supply ONE user in your arguments');
            return;
        }
        const mentionMember = mentionMembers.values().next().value as GuildMember;
        const guild = await GuildManager.instance.getGuild(message.guild.id);
        const bot = await DiscordUtils.getBot(guild.id);
        const botHighestRole = bot.roles.highest;
        const roleOfMember = mentionMember.roles.highest;
        if (roleOfMember.position > botHighestRole.position) {
            message.reply("You can not use this command against a member who's highest role is above this bots highest role");
            return;
        }
        if (roleOfMember.position >= message.member.roles.highest.position) {
            message.reply("You can not use this command against a member who's role is higher than yours!");
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
        } else {
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
        message.reply(`user ${mentionMember.user.username} has been persisted to always be "${usernameToPersist}"`);
    }
}