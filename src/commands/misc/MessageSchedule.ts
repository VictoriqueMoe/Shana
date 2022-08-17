import {Client, Discord, Guard, Slash, SlashGroup, SlashOption} from "discordx";
import {Category, NotBot} from "@discordx/utilities";
import {CronUtils, DiscordUtils, ObjectUtil} from "../../utils/Utils.js";
import {
    ApplicationCommandOptionType,
    BaseGuildTextChannel,
    Channel,
    CommandInteraction,
    EmbedBuilder
} from "discord.js";
import {injectable} from "tsyringe";
import {MessageScheduleManager} from "../../model/framework/manager/MessageScheduleManager.js";
import InteractionUtils = DiscordUtils.InteractionUtils;
import allChannelsExceptCat = DiscordUtils.allChannelsExceptCat;

@Discord()
@Category("Misc")
@SlashGroup({
    name: "message_schedule",
    description: "Commands to schedule posts to channels",
})
@SlashGroup("messageschedule")
@injectable()
export class MessageSchedule {
    public constructor(private _messageScheduleManager: MessageScheduleManager, private _client: Client) {
    }

    @Slash({
        name: "get_scheduled_message",
        description: "get all scheduled posts optionally by channel"
    })
    @Guard(NotBot)
    private async getScheduledMessage(
        @SlashOption({
            name: "channel",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: allChannelsExceptCat,
            description: "A filter for all scheduled messages by channel",
            required: false,
        })
            channel: Channel,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        const {guildId} = interaction;
        if (ObjectUtil.isValidObject(channel) && !(channel instanceof BaseGuildTextChannel)) {
            return InteractionUtils.replyOrFollowUp(interaction, "Channel must be a text channel, that is a channel that i can send message to");
        }
        const botAvatar = this._client.user.displayAvatarURL();
        const embed = new EmbedBuilder()
            .setColor(this._client.user.hexAccentColor)
            .setAuthor({
                name: `${this._client.user.username}`,
                iconURL: botAvatar
            })
            .setTimestamp();
        const result = this._messageScheduleManager.getAllActiveMessageSchedules(guildId, channel as BaseGuildTextChannel | null);
        if (!ObjectUtil.isValidArray(result)) {
            embed.setDescription("There are no scheduled posts registered this server or channel");
        }
        for (const schedule of result) {
            const whoCreated = await this._messageScheduleManager.getOwner(schedule);
            let replyStr = `scheduled to post ${CronUtils.cronToString(schedule.cron as string)} on channel "<#${schedule.channel.id}>"`;
            replyStr += `\n**content:**\n${schedule.message}`;
            if (whoCreated) {
                replyStr += `\n**Created by:**\n<@${whoCreated.id}>`;
            }
            embed.addFields(ObjectUtil.singleFieldBuilder(schedule.name, replyStr));
        }
        interaction.editReply({
            embeds: [embed]
        });
    }

    @Slash({
        name: "remove_scheduled_message",
        description: "remove a scheduled post by name"
    })
    @Guard(NotBot)
    private async removeScheduledMessage(
        @SlashOption({
            description: "The Unique ID of the schedule schedule you want to remove",
            name: "name",
            type: ApplicationCommandOptionType.String
        })
            name: string,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        const {guildId} = interaction;
        try {
            const didRemove = await this._messageScheduleManager.deleteMessageSchedule(guildId, name);
            if (!didRemove) {
                return InteractionUtils.replyOrFollowUp(interaction, `Unable to find schedule with name "${name}"`);
            }
        } catch (e) {
            return InteractionUtils.replyOrFollowUp(interaction, e.message);
        }
        return InteractionUtils.replyOrFollowUp(interaction, `schedule "${name}" has been deleted and stopped`);
    }

    @Slash({
        name: "add_scheduled_message",
        description: "create a message to schedule to a channel"
    })
    @Guard(NotBot)
    private async scheduleMessage(
        @SlashOption({
            name: "name",
            description: "The Unique ID of this scheduled job",
            type: ApplicationCommandOptionType.String
        })
            name: string,
        @SlashOption({
            description: "The channel to post to",
            name: "channel",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: allChannelsExceptCat
        })
            channel: Channel,
        @SlashOption({
            name: "cron",
            description: "the cron string to represent the time",
            type: ApplicationCommandOptionType.String
        })
            cron: string,
        @SlashOption({
            description: "the message to post",
            name: "message",
            type: ApplicationCommandOptionType.String
        })
            message: string,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        const {guildId} = interaction;
        if (!(channel instanceof BaseGuildTextChannel)) {
            return InteractionUtils.replyOrFollowUp(interaction, "Channel must be a text channel, that is a channel that i can send message to");
        }
        const member = InteractionUtils.getInteractionCaller(interaction);
        try {
            await this._messageScheduleManager.addMessageSchedule(guildId, channel, cron, message, member, name);
        } catch (e) {
            return InteractionUtils.replyOrFollowUp(interaction, e.message);
        }
        return InteractionUtils.replyOrFollowUp(interaction, `schedule "${name}" has been scheduled to post ${CronUtils.cronToString(cron)} on channel "<#${channel.id}>"`);
    }
}
