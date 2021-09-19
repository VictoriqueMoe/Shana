import {Discord, Guard, Slash, SlashGroup, SlashOption} from "discordx";
import {NotBotInteraction} from "../../guards/NotABot";
import {secureCommandInteraction} from "../../guards/RoleConstraint";
import {DiscordUtils, ObjectUtil} from "../../utils/Utils";
import {Main} from "../../Main";
import {Channel, CommandInteraction, GuildMember, User} from "discord.js";
import {AbstractCommandModule} from "../AbstractCommandModule";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@SlashGroup("Ages", "commands to get ages of accounts and servers")
export abstract class AccountAge extends AbstractCommandModule<any> {

    protected constructor() {
        super({
            module: {
                name: "Ages",
                description: "commands to get ages of accounts and servers"
            },
            commands: [
                {
                    name: "age",
                    isSlash: true,
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
                    isSlash: true,
                    description: {
                        text: "Get the age of this server"
                    }
                },
                {
                    name: "channelAge",
                    isSlash: true,
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

    @Slash("serverAge", {
        description: "Get the age of this server"
    })
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async serverAge(interaction: CommandInteraction): Promise<void> {
        const guildId = interaction.guild.id;
        const guild = await Main.client.guilds.fetch(guildId);
        const ageObject = AccountAge.getAge(guild);
        return InteractionUtils.replyWithText(interaction, `Server is: ${ageObject.ageHumanReadable}\n and was created at: ${ageObject.utcDate}`);
    }

    @Slash("channelAge", {
        description: "View the age of a channel"
    })
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async channelAge(
        @SlashOption("Channel", {
            description: "The reference to the channel",
            required: true
        })
            channel: Channel,
        interaction: CommandInteraction
    ): Promise<void> {
        const ageObject = AccountAge.getAge(channel);
        return InteractionUtils.replyWithText(interaction, `Channel is: ${ageObject.ageHumanReadable}\n and was created at: ${ageObject.utcDate}`);
    }


    @Slash("age", {
        description: "Get the age on an account"
    })
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async getAccountAge(
        @SlashOption("User", {
            description: "The user you want to check the account age of",
            required: true
        })
            user: User,
        interaction: CommandInteraction
    ): Promise<void> {
        const ageObject = AccountAge.getAge(user);
        return InteractionUtils.replyWithText(interaction, `Account is: ${ageObject.ageHumanReadable}\n and was created at: ${ageObject.utcDate}`);
    }
}