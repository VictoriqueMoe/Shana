import {Client, DefaultPermissionResolver, Discord, Guard, Permission, Slash, SlashGroup, SlashOption} from "discordx";
import {NotBotInteraction} from "../../guards/NotABot";
import {CommandEnabled} from "../../guards/CommandEnabled";
import {DiscordUtils, ObjectUtil} from "../../utils/Utils";
import {Channel, CommandInteraction, GuildMember, User} from "discord.js";
import {AbstractCommandModule} from "../AbstractCommandModule";
import {injectable} from "tsyringe";
import {Category} from "@discordx/utilities";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@Category("Ages", "commands to get ages of accounts and servers")
@Category("Ages", [
    {
        name: "userAge",
        description: "Get the age on an account",
        type: "SLASH",
        options: [{
            name: "user",
            type: "USER",
            optional: false,
            description: "The user you want to check the account age of"
        }]
    },
    {
        name: "serverAge",
        description: "Get the age of this server",
        type: "SLASH",
        options: []
    },
    {
        name: "channelAge",
        description: "View the age of a channel",
        type: "SLASH",
        options: [{
            name: "Channel",
            type: "CHANNEL",
            optional: false,
            description: "The reference to the channel"
        }]
    }
])
@Permission(new DefaultPermissionResolver(AbstractCommandModule.getDefaultPermissionAllow))
@Permission(AbstractCommandModule.getPermissions)
@SlashGroup("ages", "commands to get ages of accounts and servers")
@injectable()
export class AccountAge extends AbstractCommandModule {

    public constructor(private _client: Client) {
        super();
    }

    private static getAge(toCall: { createdTimestamp: number }): { ageHumanReadable: string, epoch: number } {
        if (toCall instanceof GuildMember) {
            toCall = toCall.user;
        }
        const timeStamp = toCall.createdTimestamp;
        const age = Date.now() - timeStamp;
        const ageHumanReadable = ObjectUtil.timeToHuman(age);
        return {
            ageHumanReadable,
            epoch: Math.round(timeStamp / 1000)
        };
    }

    @Slash("serverage", {
        description: "Get the age of this server"
    })
    @Guard(NotBotInteraction, CommandEnabled)
    private async serverAge(interaction: CommandInteraction): Promise<void> {
        const guildId = interaction.guild.id;
        const guild = await this._client.guilds.fetch(guildId);
        const ageObject = AccountAge.getAge(guild);
        return InteractionUtils.replyOrFollowUp(interaction, `Server is: ${ageObject.ageHumanReadable} old\n and was created on: <t:${ageObject.epoch}:F>`);
    }

    @Slash("channelage", {
        description: "View the age of a channel"
    })
    @Guard(NotBotInteraction, CommandEnabled)
    private async channelAge(
        @SlashOption("channel", {
            description: "The reference to the channel"
        })
            channel: Channel,
        interaction: CommandInteraction
    ): Promise<void> {
        const ageObject = AccountAge.getAge(channel);
        return InteractionUtils.replyOrFollowUp(interaction, `<#${channel.id}> is: ${ageObject.ageHumanReadable} old\n and was created on: <t:${ageObject.epoch}:F>`);
    }


    @Slash("userage", {
        description: "Get the age on an account"
    })
    @Guard(NotBotInteraction, CommandEnabled)
    private async getAccountAge(
        @SlashOption("user", {
            description: "The user you want to check the account age of"
        })
            user: User,
        interaction: CommandInteraction
    ): Promise<void> {
        const ageObject = AccountAge.getAge(user);
        return InteractionUtils.replyOrFollowUp(interaction, ` <@${user.id}>'s account is: ${ageObject.ageHumanReadable}\nand was created on: <t:${ageObject.epoch}:F>`);
    }
}