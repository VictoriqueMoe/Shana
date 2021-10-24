import {Client, DefaultPermissionResolver, Discord, Guard, Permission, Slash, SlashGroup, SlashOption} from "discordx";
import {injectable} from "tsyringe";
import {AbstractCommandModule} from "../AbstractCommandModule";
import {MessageScheduleManager} from "../../model/guild/manager/MessageScheduleManager";
import {NotBotInteraction} from "../../guards/NotABot";
import {CommandEnabled} from "../../guards/CommandEnabled";
import {BaseGuildTextChannel, Channel, CommandInteraction, MessageEmbed} from "discord.js";
import {ArrayUtils, CronUtils, DiscordUtils, ObjectUtil} from "../../utils/Utils";
import {Category} from "@discordx/utilities";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@Category("messageschedule", "Commands to schedule posts to channels")
@Category("messageschedule", [
    {
        "name": "addScheduleMessage",
        "type": "SLASH",
        "options": [
            {
                "name": "name",
                "description": "The Unique ID of this scheduled job",
                "optional": false,
                "type": "STRING"
            },
            {
                "name": "channel",
                "description": "The channel to post to",
                "optional": false,
                "type": "USER"
            },
            {
                "name": "cron",
                "description": "the cron string to represent the time",
                "optional": false,
                "type": "STRING"
            },
            {
                "name": "message",
                "description": "the message to post",
                "optional": false,
                "type": "STRING"
            }
        ],
        "description": "create a message to schedule to a channel"
    },
    {
        "name": "removeScheduledMessage",
        "type": "SLASH",
        "options": [
            {
                "name": "name",
                "description": "The Unique ID of the schedule schedule you want to remove",
                "optional": false,
                "type": "STRING"
            }
        ],
        "description": "remove a scheduled post by name"
    },
    {
        "name": "getScheduledMessage",
        "type": "SLASH",
        "options": [
            {
                "name": "channel",
                "description": "A filter for all scheduled messages by channel",
                "optional": false,
                "type": "USER"
            }
        ],
        "description": "get all scheduled posts optionally by channel"
    }
])
@SlashGroup("messageschedule", "Commands to schedule posts to channels")
@Permission(new DefaultPermissionResolver(AbstractCommandModule.getDefaultPermissionAllow))
@Permission(AbstractCommandModule.getPermissions)
@injectable()
export class MessageSchedule extends AbstractCommandModule {
    public constructor(private _messageScheduleManager: MessageScheduleManager, private _client: Client) {
        super();
    }

    @Slash("getscheduledmessage", {
        description: "get all scheduled posts optionally by channel"
    })
    @Guard(NotBotInteraction, CommandEnabled)
    private async getScheduledMessage(
        @SlashOption("channel", {
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
        const botAvatar = this._client.user.displayAvatarURL({dynamic: true});
        const embed = new MessageEmbed()
            .setColor(this._client.user.hexAccentColor)
            .setTitle(``)
            .setAuthor(`${this._client.user.username}`, botAvatar)
            .setTimestamp();
        const result = this._messageScheduleManager.getAllActiveMessageSchedules(guildId, channel as BaseGuildTextChannel | null);
        if (!ArrayUtils.isValidArray(result)) {
            embed.setDescription("There are no scheduled posts registered this server or channel");
        }
        for (const schedule of result) {
            const whoCreated = await this._messageScheduleManager.getOwner(schedule);
            let replyStr = `scheduled to post ${CronUtils.cronToString(schedule.cron as string)} on channel "<#${schedule.channel.id}>"`;
            replyStr += `\n**content:**\n${schedule.message}`;
            if (whoCreated) {
                replyStr += `\n**Created by:**\n<@${whoCreated.id}>`;
            }
            embed.addField(schedule.name, replyStr);
        }
        interaction.editReply({
            embeds: [embed]
        });
    }

    @Slash("removescheduledmessage", {
        description: "remove a scheduled post by name"
    })
    @Guard(NotBotInteraction, CommandEnabled)
    private async removeScheduledMessage(
        @SlashOption("name", {
            description: "The Unique ID of the schedule schedule you want to remove",
            required: true,
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

    @Slash("addschedulemessage", {
        description: "create a message to schedule to a channel"
    })
    @Guard(NotBotInteraction, CommandEnabled)
    private async scheduleMessage(
        @SlashOption("name", {
            description: "The Unique ID of this schedule schedule",
            required: true,
        })
            name: string,
        @SlashOption("channel", {
            description: "The channel to post to",
            required: true,
        })
            channel: Channel,
        @SlashOption("cron", {
            description: "the cron string to represent the time",
            required: true,
        })
            cron: string,
        @SlashOption("message", {
            description: "the message to post",
            required: true,
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