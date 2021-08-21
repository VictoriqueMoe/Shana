import {Discord, Guard, SimpleCommand, SimpleCommandMessage} from "discordx";
import {NotBot} from "../../guards/NotABot";
import {secureCommand} from "../../guards/RoleConstraint";
import {ObjectUtil} from "../../utils/Utils";
import {Main} from "../../Main";
import {GuildChannel} from "discord.js";
import {AbstractCommandModule} from "../AbstractCommandModule";


type AgeType = {
    ageHumanReadable: string,
    utcDate: string
}

interface Dateable {
    createdAt: Date;
}

@Discord()
export abstract class AccountAge extends AbstractCommandModule<any> {

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

    @SimpleCommand("serverAge")
    @Guard(NotBot, secureCommand)
    private async serverAge({message}: SimpleCommandMessage): Promise<void> {
        const guildId = message.guild.id;
        const guild = await Main.client.guilds.fetch(guildId);
        const ageObject = this.getAge(guild);
        message.reply(`Server is: ${ageObject.ageHumanReadable}\n and was created at: ${ageObject.utcDate}`);
    }

    @SimpleCommand("channelAge")
    @Guard(NotBot, secureCommand)
    private async channelAge({message}: SimpleCommandMessage): Promise<void> {
        const channelsInMessage = message.mentions.channels;
        if (channelsInMessage.size !== 1) {
            message.reply("Please make sure you mention 1 channel only");
            return;
        }
        const channelMentioned = channelsInMessage.first() as GuildChannel;
        const ageObject = this.getAge(channelMentioned);
        message.reply(`Channel is: ${ageObject.ageHumanReadable}\n and was created at: ${ageObject.utcDate}`);
    }


    @SimpleCommand("age")
    @Guard(NotBot, secureCommand)
    private async getAccountAge({message}: SimpleCommandMessage): Promise<void> {
        const mentions = message.mentions;
        if (mentions.users.size != 1) {
            message.reply("Please supply username");
            return;
        }
        const mention = mentions.users.first();
        const ageObject = this.getAge(mention);
        message.reply(`Account is: ${ageObject.ageHumanReadable}\n and was created at: ${ageObject.utcDate}`);
    }
}