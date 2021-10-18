import {Discord, Guard, Slash, SlashGroup, SlashOption} from "discordx";
import {injectable} from "tsyringe";
import {AbstractCommandModule} from "../AbstractCommandModule";
import {MessageScheduleModel} from "../../model/DB/guild/MessageSchedule.model";
import {MessageScheduleManager} from "../../model/guild/manager/MessageScheduleManager";
import {NotBotInteraction} from "../../guards/NotABot";
import {secureCommandInteraction} from "../../guards/RoleConstraint";
import {BaseGuildTextChannel, Channel, CommandInteraction} from "discord.js";
import {CronUtils, DiscordUtils} from "../../utils/Utils";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@SlashGroup("messageschedule", "Commands to schedule posts to channels")
@injectable()
export class MessageSchedule extends AbstractCommandModule<MessageScheduleModel> {
    public constructor(private _messageScheduleManager: MessageScheduleManager) {
        super({
            module: {
                name: "messageschedule",
                description: "Commands to schedule posts to channels"
            },
            commands: [
                {
                    name: "scheduleMessage",
                    type: "slash",
                    description: {
                        text: "create a message to schedule to a channel",
                        args: [
                            {
                                name: "name",
                                type: "text",
                                description: "The Unique ID of this schedule job",
                                optional: false
                            },
                            {
                                name: "channel",
                                type: "mention",
                                description: "The channel to post to",
                                optional: false
                            },
                            {
                                name: "cron",
                                type: "text",
                                description: "the cron string to represent the time",
                                optional: false
                            },
                            {
                                name: "message",
                                type: "text",
                                description: "the message to post",
                                optional: false
                            }
                        ]
                    }
                }
            ]
        });
    }

    @Slash("schedulemessage", {
        description: "create a message to schedule to a channel"
    })
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async scheduleMessage(
        @SlashOption("name", {
            description: "The Unique ID of this schedule job",
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
        return InteractionUtils.replyOrFollowUp(interaction, `job "${name}" has been scheduled to post ${CronUtils.cronToString(cron)} on channel "<#${channel.id}>"`);
    }
}