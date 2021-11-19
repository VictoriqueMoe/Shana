import {
    ContextMenu,
    DefaultPermissionResolver,
    Discord,
    Guard,
    Permission,
    Slash,
    SlashChoice,
    SlashGroup,
    SlashOption
} from "discordx";
import {DiscordUtils, GuildUtils, ObjectUtil, TimeUtils} from "../../../utils/Utils";
import {NotBotInteraction} from "../../../guards/NotABot";
import {CommandEnabled} from "../../../guards/CommandEnabled";
import {CommandInteraction, ContextMenuInteraction, GuildMember, User} from "discord.js";
import {MuteManager} from "../../../model/guild/manager/MuteManager";
import {AbstractCommandModule} from "../../AbstractCommandModule";
import {injectable} from "tsyringe";
import {Category} from "@discordx/utilities";
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@Category("Mute", "Commands to mute people from servers")
@Category("Mute", [
    {
        name: "shut",
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
                optional: true,
                type: "STRING",
                description: "The reason why this user is muted (defaults to 'muted for {TIME}')"
            },
            {
                name: "Timeout",
                optional: true,
                type: "NUMBER",
                description: "timeout in seconds for how long this user should be muted (defaults to 1)"
            },
            {
                name: "TimeUnit",
                optional: true,
                type: "STRING",
                description: "The time unit used to specify how long a user should be muted (defaults to days)"
            }
        ]
    },
    {
        name: "Mute for 1 Hour",
        description: "Mute the current user for 1 hour",
        type: "CONTEXT USER"
    },
    {
        name: "Mute for 6 Hours",
        description: "Mute the current user for 6 hours",
        type: "CONTEXT USER"
    },
    {
        name: "Mute for 1 day",
        description: "Mute the current user for 1 day",
        type: "CONTEXT USER"
    },
    {
        name: "viewAllMutes",
        description: "View all the currently active mutes",
        type: "SLASH",
        options: []
    }
])
@Permission(new DefaultPermissionResolver(AbstractCommandModule.getDefaultPermissionAllow))
@Permission(AbstractCommandModule.getPermissions)
@SlashGroup("mute", "Commands to mute people from servers")
@injectable()
export class Mute extends AbstractCommandModule {

    public constructor(private _muteManager: MuteManager) {
        super();
    }


    @ContextMenu("USER", "Mute for 1 Hour")
    @Guard(CommandEnabled)
    private async muteFor1Hour(interaction: ContextMenuInteraction): Promise<void> {
        await interaction.deferReply();
        return this.muteFromContext(interaction, 1, TimeUtils.TIME_UNIT.hours);
    }

    @ContextMenu("USER", "Mute for 6 Hours")
    @Guard(CommandEnabled)
    private async muteFor6Hours(interaction: ContextMenuInteraction): Promise<void> {
        await interaction.deferReply();
        return this.muteFromContext(interaction, 6, TimeUtils.TIME_UNIT.hours);
    }


    @ContextMenu("USER", "Mute for 1 day")
    @Guard(CommandEnabled)
    private async muteFor1Day(interaction: ContextMenuInteraction): Promise<void> {
        await interaction.deferReply();
        return this.muteFromContext(interaction, 1, TimeUtils.TIME_UNIT.days);
    }


    private async muteFromContext(interaction: ContextMenuInteraction, timeOut: number, timeUnit: TimeUtils.TIME_UNIT): Promise<void> {
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
            replyMessage = await this.muteUser(member, creator, guildId, timeOut, timeUnit);
            return InteractionUtils.replyOrFollowUp(interaction, replyMessage);
        } catch (e) {
            return InteractionUtils.replyOrFollowUp(interaction, (<Error>e).message);
        }
    }

    @Slash("shut", {
        description: "Block a user from sending any messages with a timeout"
    })
    @Guard(NotBotInteraction, CommandEnabled)
    private async shut(
        @SlashOption("user", {
            description: "User you wish to mute",
            required: true
        })
            mentionedMember: User,
        @SlashOption("reason", {
            description: "The reason why this user is muted",
            required: false
        })
            reason: string,
        @SlashOption("timeout", {
            description: "timeout for how long this user should be muted.",
            required: false,
            type: "INTEGER"
        })
            timeout: number,
        @SlashChoice(TimeUtils.TIME_UNIT)
        @SlashOption("timeunit", {
            description: "The time unit used to specify how long a user should be muted",
            required: false
        })
            timeUnit: TimeUtils.TIME_UNIT,
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
            if (isNaN(undefined)) {
                timeout = 1;
            }
            if (!timeUnit) {
                timeUnit = TimeUtils.TIME_UNIT.days;
            }
            replyMessage = await this.muteUser(mentionedMember, creator, guildId, timeout, timeUnit, reason);
            return InteractionUtils.replyOrFollowUp(interaction, replyMessage);
        } catch (e) {
            return InteractionUtils.replyOrFollowUp(interaction, (<Error>e).message);
        }
    }

    private async muteUser(mentionedMember: GuildMember, creator: GuildMember, guildId: string, timeout: number, timeUnit: TimeUtils.TIME_UNIT, reason?: string): Promise<string> {
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
        if (!ObjectUtil.validString(reason)) {
            reason = `muted for: ${ObjectUtil.timeToHuman(timeout, timeUnit)}`;
        }
        let replyMessage = `User "${mentionedMember.user.username}" has been muted from this server with reason "${reason}"`;
        await this._muteManager.muteUser(mentionedMember, reason, creatorID, timeout, timeUnit);
        replyMessage += ` for ${ObjectUtil.timeToHuman(timeout, timeUnit)}`;
        return replyMessage;
    }

    @Slash("viewallmutes", {
        description: "View all the currently active mutes"
    })
    @Guard(NotBotInteraction, CommandEnabled)
    private async viewAllMutes(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        const guildId = interaction.guild.id;
        const currentBlocks = await this._muteManager.getAllMutedMembers(guildId);
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