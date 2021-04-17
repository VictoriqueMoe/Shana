import {Command, CommandMessage, Description, Guard} from "@typeit/discord";
import {NotBot} from "../../guards/NotABot";
import {roleConstraints} from "../../guards/RoleConstraint";
import {BlockGuard} from "../../guards/BlockGuard";
import {Roles} from "../../enums/Roles";
import {DiscordUtils, ObjectUtil} from "../../utils/Utils";
import {AbstractCommand} from "../AbstractCommand";
import {AdminOnlyTask} from "../../guards/AdminOnlyTask";
import {Main} from "../../Main";
import RolesEnum = Roles.RolesEnum;

export abstract class AccountAge extends AbstractCommand<any> {

    constructor() {
        super({
            module: {
                name: "Ages",
                description: "commands to get ages of accounts and servers"
            },
            commands: [
                {
                    name: "age",
                    description: {
                        text: "Get the age on an account",
                        args: [
                            {
                                name: "user",
                                type: "mention",
                                optional: false,
                                description: "The user you want to check the account age of"
                            }
                        ]
                    }
                },
                {
                    name: "serverAge",
                    description: {
                        text: "Get the age of this server"
                    }
                }
            ]
        });
    }

    @Command("serverAge")
    @Description(AccountAge.viewDescriptionForSetUsernames())
    @Guard(NotBot, AdminOnlyTask)
    private async serverAge(command: CommandMessage): Promise<void> {
        const guildId = command.guild.id;
        const guild = await Main.client.guilds.fetch(guildId);
        const guildDate = guild.createdAt;
        const timeStamp = guildDate.getTime();
        const age = Date.now() - timeStamp;
        const humanReadable = ObjectUtil.secondsToHuman(Math.round(age / 1000));
        const dateCreatedStr = guildDate.toUTCString();
        command.reply(`Server is: ${humanReadable}\n and was created was created at: ${dateCreatedStr}`);
    }

    @Command("age")
    @Description(AccountAge.viewDescriptionForSetUsernames())
    @Guard(NotBot, roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE), BlockGuard)
    private async getAccountAge(command: CommandMessage): Promise<void> {
        const mentions = command.mentions;
        if (mentions.users.size != 1) {
            command.reply("Please supply username");
            return;
        }
        const mention = mentions.users.array()[0];
        const age = DiscordUtils.getAccountAge(mention, true);
        command.reply(`Account age is is: ${age}`);
    }

    private static viewDescriptionForSetUsernames() {
        return '\n Get the age of a discord account: \n usage ~age <"account">';
    }
}