import {Client, DefaultPermissionResolver, Discord, Guard, Permission, Slash, SlashGroup, SlashOption} from "discordx";
import {NotBotInteraction} from "../../guards/NotABot.js";
import {CommandEnabled} from "../../guards/CommandEnabled.js";
import {DiscordUtils, ObjectUtil} from "../../utils/Utils.js";
import {Channel, CommandInteraction, GuildMember, User} from "discord.js";
import {AbstractCommandModule} from "../AbstractCommandModule.js";
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

    private static getAge(toCall: { createdAt: Date }): { ageHumanReadable: string, utcDate: string } {
        if (toCall instanceof GuildMember) {
            toCall = toCall.user;
        }
        const guildDate = toCall.createdAt;
        const timeStamp = guildDate.getTime();
        const age = Date.now() - timeStamp;
        const ageHumanReadable = ObjectUtil.timeToHuman(age);
        const utcDate = guildDate.toUTCString();
        return {
            ageHumanReadable,
            utcDate
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
        return InteractionUtils.replyOrFollowUp(interaction, `Server is: ${ageObject.ageHumanReadable} old\n and was created at: ${ageObject.utcDate}`);
    }

    @Slash("channelage", {
        description: "View the age of a channel"
    })
    @Guard(NotBotInteraction, CommandEnabled)
    private async channelAge(
        @SlashOption("channel", {
            description: "The reference to the channel",
            required: true
        })
            channel: Channel,
        interaction: CommandInteraction
    ): Promise<void> {
        const ageObject = AccountAge.getAge(channel);
        return InteractionUtils.replyOrFollowUp(interaction, `<#${channel.id}> is: ${ageObject.ageHumanReadable} old\n and was created at: ${ageObject.utcDate}`);
    }


    @Slash("age", {
        description: "Get the age on an account"
    })
    @Guard(NotBotInteraction, CommandEnabled)
    private async getAccountAge(
        @SlashOption("user", {
            description: "The user you want to check the account age of",
            required: true
        })
            user: User,
        interaction: CommandInteraction
    ): Promise<void> {
        const ageObject = AccountAge.getAge(user);
        return InteractionUtils.replyOrFollowUp(interaction, ` <@${user.id}>'s account is: ${ageObject.ageHumanReadable}\nand was created at: ${ageObject.utcDate}`);
    }
}