import {Command, CommandMessage, Guard} from "@typeit/discord";
import {NotBot} from "../../guards/NotABot";
import {roleConstraints} from "../../guards/RoleConstraint";
import {BlockGuard} from "../../guards/BlockGuard";
import {Roles} from "../../enums/Roles";
import {ObjectUtil} from "../../utils/Utils";
import {AbstractCommand} from "../AbstractCommand";
import {AdminOnlyTask} from "../../guards/AdminOnlyTask";
import {Main} from "../../Main";
import {GuildChannel} from "discord.js";
import RolesEnum = Roles.RolesEnum;


type AgeType = {
    ageHumanReadable: string,
    utcDate: string
}

interface Dateable {
    createdAt: Date
}

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
                },
                {
                    name: "channelAge",
                    description: {
                        text: "View the age of a channel",
                        args: [
                            {
                                name: "Channel",
                                type: "mention",
                                description: "The reference to the channel",
                                optional: false
                            }
                        ]
                    }
                }
            ]
        });
    }

    private getAge(toCall: Dateable): AgeType {
        const guildDate = toCall.createdAt;
        const timeStamp = guildDate.getTime();
        const age = Date.now() - timeStamp;
        const humanReadable = ObjectUtil.secondsToHuman(Math.round(age / 1000));
        const dateCreatedStr = guildDate.toUTCString();
        return {
            ageHumanReadable: humanReadable,
            utcDate: dateCreatedStr
        };
    }

    @Command("serverAge")
    @Guard(NotBot, AdminOnlyTask)
    private async serverAge(command: CommandMessage): Promise<void> {
        const guildId = command.guild.id;
        const guild = await Main.client.guilds.fetch(guildId);
        const ageObject = this.getAge(guild);
        command.reply(`Server is: ${ageObject.ageHumanReadable}\n and was created at: ${ageObject.utcDate}`);
    }

    @Command("channelAge")
    @Guard(NotBot, AdminOnlyTask)
    private async channelAge(command: CommandMessage): Promise<void> {
        const channelsInMessage = command.mentions.channels;
        if (channelsInMessage.size !== 1) {
            command.reply("Please make sure you mention 1 channel only");
            return;
        }
        const channelMentioned = channelsInMessage.first() as GuildChannel;
        const ageObject = this.getAge(channelMentioned);
        command.reply(`Channel is: ${ageObject.ageHumanReadable}\n and was created at: ${ageObject.utcDate}`);
    }


    @Command("age")
    @Guard(NotBot, roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE), BlockGuard)
    private async getAccountAge(command: CommandMessage): Promise<void> {
        const mentions = command.mentions;
        if (mentions.users.size != 1) {
            command.reply("Please supply username");
            return;
        }
        const mention = mentions.users.array()[0];
        const ageObject = this.getAge(mention);
        command.reply(`Account is: ${ageObject.ageHumanReadable}\n and was created at: ${ageObject.utcDate}`);
    }
}