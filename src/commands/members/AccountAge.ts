import {Client, Discord, Guard, Slash, SlashGroup, SlashOption} from "discordx";
import {ApplicationCommandOptionType, Channel, CommandInteraction, GuildMember, User} from "discord.js";
import {DiscordUtils, ObjectUtil} from "../../utils/Utils.js";
import {injectable} from "tsyringe";
import {Category, NotBot} from "@discordx/utilities";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@Category("Members")
@SlashGroup({
    name: "ages",
    description: "commands to get ages of accounts and servers"
})
@SlashGroup("ages")
@injectable()
export class AccountAge {

    public constructor(private _client: Client) {
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

    @Slash({
        name: "server_age",
        description: "Get the age of this server"
    })
    @Guard(NotBot)
    private async serverAge(interaction: CommandInteraction): Promise<void> {
        const guildId = interaction.guild.id;
        const guild = await this._client.guilds.fetch(guildId);
        const ageObject = AccountAge.getAge(guild);
        return InteractionUtils.replyOrFollowUp(interaction, `Server is: ${ageObject.ageHumanReadable} old\n and was created on: <t:${ageObject.epoch}:F>`);
    }

    @Slash({
        name: "channel_age",
        description: "View the age of a channel"
    })
    @Guard(NotBot)
    private async channelAge(
        @SlashOption({
            name: "channel",
            description: "The reference to the channel",
            channelTypes: DiscordUtils.allChannelsExceptCat,
            type: ApplicationCommandOptionType.Channel
        })
            channel: Channel,
        interaction: CommandInteraction
    ): Promise<void> {
        const ageObject = AccountAge.getAge(channel);
        return InteractionUtils.replyOrFollowUp(interaction, `<#${channel.id}> is: ${ageObject.ageHumanReadable} old\n and was created on: <t:${ageObject.epoch}:F>`);
    }


    @Slash({
        name: "user_age",
        description: "Get the age on an account"
    })
    @Guard(NotBot)
    private async getAccountAge(
        @SlashOption({
            name: "user",
            description: "The user you want to check the account age of",
            type: ApplicationCommandOptionType.User
        })
            user: User,
        interaction: CommandInteraction
    ): Promise<void> {
        const ageObject = AccountAge.getAge(user);
        return InteractionUtils.replyOrFollowUp(interaction, `<@${user.id}>'s account is: ${ageObject.ageHumanReadable}\nand was created on: <t:${ageObject.epoch}:F>`);
    }
}
