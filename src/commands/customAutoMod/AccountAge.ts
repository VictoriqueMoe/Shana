import {Client, Discord, Guard, Slash, SlashGroup, SlashOption} from "discordx";
import {NotBotInteraction} from "../../guards/NotABot";
import {secureCommandInteraction} from "../../guards/RoleConstraint";
import {DiscordUtils, ObjectUtil} from "../../utils/Utils";
import {Channel, CommandInteraction, GuildMember, User} from "discord.js";
import {AbstractCommandModule} from "../AbstractCommandModule";
import {injectable} from "tsyringe";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@SlashGroup("ages", "commands to get ages of accounts and servers")
@injectable()
export class AccountAge extends AbstractCommandModule<any> {

    public constructor(private _client: Client) {
        super({
            module: {
                name: "Ages",
                description: "commands to get ages of accounts and servers"
            },
            commands: [
                {
                    name: "age",
                    type: "slash",
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
                    type: "slash",
                    description: {
                        text: "Get the age of this server"
                    }
                },
                {
                    name: "channelAge",
                    type: "slash",
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

    private static getAge(toCall: { createdAt: Date }): { ageHumanReadable: string, utcDate: string } {
        if (toCall instanceof GuildMember) {
            toCall = toCall.user;
        }
        const guildDate = toCall.createdAt;
        const timeStamp = guildDate.getTime();
        const age = Date.now() - timeStamp;
        const ageHumanReadable = ObjectUtil.secondsToHuman(Math.round(age / 1000));
        const utcDate = guildDate.toUTCString();
        return {
            ageHumanReadable,
            utcDate
        };
    }

    @Slash("serverage", {
        description: "Get the age of this server"
    })
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async serverAge(interaction: CommandInteraction): Promise<void> {
        const guildId = interaction.guild.id;
        const guild = await this._client.guilds.fetch(guildId);
        const ageObject = AccountAge.getAge(guild);
        return InteractionUtils.replyOrFollowUp(interaction, `Server is: ${ageObject.ageHumanReadable}\n and was created at: ${ageObject.utcDate}`);
    }

    @Slash("channelage", {
        description: "View the age of a channel"
    })
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async channelAge(
        @SlashOption("channel", {
            description: "The reference to the channel",
            required: true
        })
            channel: Channel,
        interaction: CommandInteraction
    ): Promise<void> {
        const ageObject = AccountAge.getAge(channel);
        return InteractionUtils.replyOrFollowUp(interaction, `Channel is: ${ageObject.ageHumanReadable}\n and was created at: ${ageObject.utcDate}`);
    }


    @Slash("age", {
        description: "Get the age on an account"
    })
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async getAccountAge(
        @SlashOption("user", {
            description: "The user you want to check the account age of",
            required: true
        })
            user: User,
        interaction: CommandInteraction
    ): Promise<void> {
        const ageObject = AccountAge.getAge(user);
        return InteractionUtils.replyOrFollowUp(interaction, `Account is: ${ageObject.ageHumanReadable}\n and was created at: ${ageObject.utcDate}`);
    }
}