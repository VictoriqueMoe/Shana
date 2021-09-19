import {Discord, Guard, Slash, SlashGroup, SlashOption} from "discordx";
import {DiscordUtils, EnumEx, GuildUtils, ObjectUtil, TimeUtils} from "../../../utils/Utils";
import {MuteModel} from "../../../model/DB/autoMod/impl/Mute.model";
import {NotBotInteraction} from "../../../guards/NotABot";
import {secureCommandInteraction} from "../../../guards/RoleConstraint";
import {CommandInteraction, GuildMember, User} from "discord.js";
import {RolePersistenceModel} from "../../../model/DB/autoMod/impl/RolePersistence.model";
import {MuteSingleton} from "./MuteSingleton";
import {AbstractCommandModule} from "../../AbstractCommandModule";
import TIME_UNIT = TimeUtils.TIME_UNIT;
import InteractionUtils = DiscordUtils.InteractionUtils;

@Discord()
@SlashGroup("Mute", "Commands to mute people from servers")
export abstract class Mute extends AbstractCommandModule<RolePersistenceModel> {

    public constructor() {
        super({
            module: {
                name: "Mute",
                description: "Commands to mute people from servers"
            },
            commands: [
                {
                    name: "mute",
                    isSlash: true,
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
                                description: "timeout in seconds for how long this user should be muted. \n you can also use the time unit at the end of the number to use other time units"
                            }
                        ]
                    }
                },
                {
                    name: "muteTimeUnits",
                    isSlash: true,
                    description: {
                        text: "Get all the available time units you can use in mute"
                    }
                },
                {
                    name: "viewAllMutes",
                    isSlash: true,
                    description: {
                        text: "View all the currently active mutes"
                    }
                }
            ]
        });
    }

    @Slash("mute", {
        description: "Block a user from sending any messages with a timeout"
    })
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async mute(
        @SlashOption("User", {
            description: "User you wish to mute",
            required: true
        })
            mentionedMember: User,
        @SlashOption("Reason", {
            description: "The reason why this user is muted",
            required: true
        })
            reason: string,
        @SlashOption("Timeout", {
            description: "timeout for how long this user should be muted.",
            required: true
        })
            timeout: string,
        interaction: CommandInteraction
    ): Promise<void> {
        await interaction.deferReply();
        if (!(mentionedMember instanceof GuildMember)) {
            return InteractionUtils.replyWithText(interaction, "Unable to find user", false);
        }
        const guildId = interaction.guild.id;
        const mutedRole = await GuildUtils.RoleUtils.getMuteRole(guildId);
        if (!mutedRole) {
            return InteractionUtils.replyWithText(interaction, "This command has not been configured or is disabled", false);
        }
        const creator = InteractionUtils.getInteractionCaller(interaction);
        if (!(creator instanceof GuildMember)) {
            return InteractionUtils.replyWithText(interaction, "Unable to inspect calle", false);
        }
        const creatorID = creator.id;
        const blockedUserId = mentionedMember.id;
        const didYouBlockABot = mentionedMember.bot;
        const canBlock = await DiscordUtils.canUserPreformBlock(creator, mentionedMember);
        const bot = await DiscordUtils.getBot(guildId);
        const botRole = bot.roles.highest;
        if (botRole.position <= mentionedMember.roles.highest.position) {
            return InteractionUtils.replyWithText(interaction, "You can not block a member whose role is above or on the same level as this bot!", false);
        }

        if (creatorID == blockedUserId) {
            return InteractionUtils.replyWithText(interaction, "You can not block yourself!", false);
        }

        if (!canBlock) {
            return InteractionUtils.replyWithText(interaction, "You can not block a member whose role is above or on the same level as yours!", false);
        }

        if (didYouBlockABot) {
            return InteractionUtils.replyWithText(interaction, "You can not block a bot", false);
        }

        let replyMessage = `User "${mentionedMember.user.username}" has been muted from this server with reason "${reason}"`;
        try {
            const unit = timeout.replace(/\d+/, "");
            const numberValueStr = timeout.slice(0, -unit.length);
            const timeEnum = EnumEx.loopBack(TIME_UNIT, unit, true) as TIME_UNIT;
            if (!ObjectUtil.validString(timeEnum)) {
                return InteractionUtils.replyWithText(interaction, `invalid unit, '${unit}', available values are: \n ${this.getMuteTimeOutStr()}`, false);
            }
            const numValue = Number.parseInt(numberValueStr);
            await MuteSingleton.instance.muteUser(mentionedMember, reason, creatorID, numValue, timeEnum);
            const seconds = TimeUtils.convertToMilli(numValue, timeEnum) / 1000;
            replyMessage += ` for ${ObjectUtil.secondsToHuman(seconds)}`;
        } catch (e) {
            return InteractionUtils.replyWithText(interaction, e.message, false);
        }
        InteractionUtils.editWithText(interaction, replyMessage);
    }

    private getMuteTimeOutStr(): string {
        const keyValuePair: Array<{ name: TIME_UNIT, value: string }> = EnumEx.getNamesAndValues(TIME_UNIT) as Array<{ name: TIME_UNIT, value: string }>;
        return keyValuePair.map(kv => {
            const {name, value}: { name: TIME_UNIT, value: string } = kv;
            return `'${value}' -> ${name}`;
        }).join("\n ");
    }

    @Slash("muteTimeUnits", {
        description: "Get all the available time units you can use in mute"
    })
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async getTimeUnits(interaction: CommandInteraction): Promise<void> {
        return InteractionUtils.replyWithText(interaction, `\n ${this.getMuteTimeOutStr()}`);
    }

    @Slash("viewAllMutes", {
        description: "View all the currently active mutes"
    })
    @Guard(NotBotInteraction, secureCommandInteraction)
    private async viewAllMutes(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        const guildId = interaction.guild.id;
        const currentBlocks = await MuteModel.findAll({
            where: {
                guildId
            }
        });
        if (currentBlocks.length === 0) {
            return InteractionUtils.replyWithText(interaction, "No members are muted", false);
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
                replyStr += `, for ${ObjectUtil.secondsToHuman(Math.round(timeOutOrigValue / 1000))} and has ${ObjectUtil.secondsToHuman(Math.round(timeLeft / 1000))} left`;
            }
            if (block.violationRules > 0) {
                replyStr += `, This user has also attempted to post ${block.violationRules} times while blocked`;
            }
        }
        await InteractionUtils.editWithText(interaction, replyStr);
    }
}