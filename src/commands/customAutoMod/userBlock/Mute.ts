import {ContextMenu, Discord, Guard, Slash, SlashChoice, SlashGroup, SlashOption} from "discordx";
import {DiscordUtils, GuildUtils, ObjectUtil, TimeUtils} from "../../../utils/Utils";
import {MuteModel} from "../../../model/DB/autoMod/impl/Mute.model";
import {NotBotInteraction} from "../../../guards/NotABot";
import {secureCommandInteraction} from "../../../guards/RoleConstraint";
import {CommandInteraction, ContextMenuInteraction, GuildMember, User} from "discord.js";
import {MuteManager} from "../../../model/guild/manager/MuteManager";
import {AbstractCommandModule} from "../../AbstractCommandModule";
import {injectable} from "tsyringe";
import {Category} from "@discordx/utilities";
import TIME_UNIT = TimeUtils.TIME_UNIT;
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@Category("Mute", "Commands to mute people from servers")
@Category("Admin Commands", [
    {
        name: "mute",
        description: "Block a user from sending any messages with an optional timeout",
        type: "SLASH",
        options: [
            {
                name: "User",
                optional: false,
                type: "USER",
                description: "User you wish to mute"
            },
            {
                name: "Reason",
                optional: false,
                type: "STRING",
                description: "The reason why this user is muted"
            },
            {
                name: "Timeout",
                optional: false,
                type: "NUMBER",
                description: "timeout in seconds for how long this user should be muted"
            },
            {
                name: "TimeUnit",
                optional: false,
                type: "STRING",
                description: "The time unit used to specify how long a user should be muted"
            }
        ]
    },
    {
        name: "Mute User for 30 mins",
        description: "Mute the current user for 30 mins",
        type: "CONTEXT USER"
    },
    {
        name: "viewAllMutes",
        description: "View all the currently active mutes",
        type: "SLASH",
        options: []
    }
])
@SlashGroup("mute", "Commands to mute people from servers")
@injectable()
export class Mute extends AbstractCommandModule {

    public constructor(private _muteManager: MuteManager) {
        super(/*{
            module: {
                name: "Mute",
                description: "Commands to mute people from servers"
            },
            commands: [
                {
                    name: "shut",
                    type: "slash",
                    description: {
                        text: "Block a user from sending any messages with an optional timeout",
                        examples: ['mute @user "they where annoying" 2d = Mute user for 2 days', 'mute @user "they where not so annoying" 60 = Mute user for 60 seconds', 'mute @user "they where REALLY annoying" = Mute user indefinitely until unmute'],
                        args: [
                            {
                                name: "User",
                                optional: false,
                                type: "mention",
                                description: "User you wish to mute"
                            },
                            {
                                name: "Reason",
                                optional: false,
                                type: "text",
                                description: "The reason why this user is muted"
                            },
                            {
                                name: "Timeout",
                                optional: false,
                                type: "number",
                                description: "timeout in seconds for how long this user should be muted"
                            },
                            {
                                name: "Timeout",
                                optional: false,
                                type: "text",
                                description: "The time unit used to specify how long a user should be muted \n see muteTimeUnits for values"
                            }
                        ]
                    }
                },
                {
                    name: "muteTimeUnits",
                    type: "slash",
                    description: {
                        text: "Get all the available time units you can use in mute"
                    }
                },
                {
                    name: "Mute User for 30 mins",
                    type: "contextMenu",
                    description: {
                        text: "Mute the current user for 30 mins"
                    }
                },
                {
                    name: "viewAllMutes",
                    type: "slash",
                    description: {
                        text: "View all the currently active mutes"
                    }
                }
            ]
        }*/);
    }


    @ContextMenu("USER", "Mute User for 30 mins")
    @Guard(secureCommandInteraction)
    private async userHandler(interaction: ContextMenuInteraction): Promise<void> {
        await interaction.deferReply();
        const member = InteractionUtils.getUserFromUserContextInteraction(interaction);
        if (!(member instanceof GuildMember)) {
            return InteractionUtils.replyOrFollowUp(interaction, "Unable to mute non-guild members");
        }
        const {guildId} = interaction;
        const mutedRole = await GuildUtils.RoleUtils.getMuteRole(guildId);
        if (!mutedRole) {
            return InteractionUtils.replyOrFollowUp(interaction, "This command has not been configured or is disabled", false);
        }
        const creator = InteractionUtils.getInteractionCaller(interaction);
        if (!(creator instanceof GuildMember)) {
            return InteractionUtils.replyOrFollowUp(interaction, "Unable to inspect calle", false);
        }
        let replyMessage: string;
        try {
            replyMessage = await this.muteUser(member, creator, guildId, "N/A", 30, TIME_UNIT.minutes);
            return InteractionUtils.replyOrFollowUp(interaction, replyMessage);
        } catch (e) {
            return InteractionUtils.replyOrFollowUp(interaction, (<Error>e).message);
        }
    }

    @Slash("shut", {
        description: "Block a user from sending any messages with a timeout"
    })
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async mute(
        @SlashOption("user", {
            description: "User you wish to mute",
            required: true
        })
            mentionedMember: User,
        @SlashOption("reason", {
            description: "The reason why this user is muted",
            required: true
        })
            reason: string,
        @SlashOption("timeout", {
            description: "timeout for how long this user should be muted.",
            required: true,
            type: "INTEGER"
        })
            timeout: number,
        @SlashChoice(TIME_UNIT)
        @SlashOption("timeunit", {
            description: "The time unit used to specify how long a user should be muted",
            required: true
        })
            timeUnit: TIME_UNIT,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply();
        if (!(mentionedMember instanceof GuildMember)) {
            return InteractionUtils.replyOrFollowUp(interaction, "Unable to find user", false);
        }
        const guildId = interaction.guild.id;
        const mutedRole = await GuildUtils.RoleUtils.getMuteRole(guildId);
        if (!mutedRole) {
            return InteractionUtils.replyOrFollowUp(interaction, "This command has not been configured or is disabled", false);
        }
        const creator = InteractionUtils.getInteractionCaller(interaction);
        if (!(creator instanceof GuildMember)) {
            return InteractionUtils.replyOrFollowUp(interaction, "Unable to inspect calle", false);
        }
        let replyMessage: string;
        try {
            replyMessage = await this.muteUser(mentionedMember, creator, guildId, reason, timeout, timeUnit);
            return InteractionUtils.replyOrFollowUp(interaction, replyMessage);
        } catch (e) {
            return InteractionUtils.replyOrFollowUp(interaction, (<Error>e).message);
        }
    }

    private async muteUser(mentionedMember: GuildMember, creator: GuildMember, guildId: string, reason: string, timeout: number, timeUnit: TIME_UNIT): Promise<string> {
        const creatorID = creator.id;
        const blockedUserId = mentionedMember.id;
        const didYouBlockABot = mentionedMember.user.bot;
        const canBlock = await DiscordUtils.canUserPreformBlock(creator, mentionedMember);
        const bot = await DiscordUtils.getBot(guildId);
        const botRole = bot.roles.highest;
        if (botRole.position <= mentionedMember.roles.highest.position) {
            throw new Error("You can not block a member whose role is above or on the same level as this bot!");
        }

        if (creatorID == blockedUserId) {
            throw new Error("You can not block yourself!");
        }

        if (!canBlock) {
            throw new Error("You can not block a member whose role is above or on the same level as yours!");
        }

        if (didYouBlockABot) {
            throw new Error("You can not block a bot");
        }

        let replyMessage = `User "${mentionedMember.user.username}" has been muted from this server with reason "${reason}"`;
        await this._muteManager.muteUser(mentionedMember, reason, creatorID, timeout, timeUnit);
        replyMessage += ` for ${ObjectUtil.timeToHuman(timeout, timeUnit)}`;
        return replyMessage;
    }

    @Slash("viewallmutes", {
        description: "View all the currently active mutes"
    })
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async viewAllMutes(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply({
            ephemeral: true
        });
        const guildId = interaction.guild.id;
        const currentBlocks = await MuteModel.findAll({
            where: {
                guildId
            }
        });
        if (currentBlocks.length === 0) {
            return InteractionUtils.replyOrFollowUp(interaction, "No members are muted", false);
        }
        let replyStr = `\n`;
        for (const block of currentBlocks) {
            const id = block.userId;
            const timeOutOrigValue = block.timeout;
            replyStr += `\n "<@${id}> (${block.username})" has been muted by "<@${block.creatorID}>" for the reason "${block.reason}"`;
            if (timeOutOrigValue > -1) {
                const now = Date.now();
                const dateCreated = (block.createdAt as Date).getTime();
                const timeLeft = timeOutOrigValue - (now - dateCreated);
                replyStr += `, for ${ObjectUtil.timeToHuman(timeOutOrigValue)} and has ${ObjectUtil.timeToHuman(timeLeft)} left`;
            }
            if (block.violationRules > 0) {
                replyStr += `, This user has also attempted to post ${block.violationRules} times while blocked`;
            }
        }
        await InteractionUtils.replyOrFollowUp(interaction, replyStr);
    }
}