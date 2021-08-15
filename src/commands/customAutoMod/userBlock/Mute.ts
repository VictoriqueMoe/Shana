import {CommandMessage, Discord, Guard, SimpleCommand} from "discordx";
import {DiscordUtils, EnumEx, GuildUtils, ObjectUtil, StringUtils, TimeUtils} from "../../../utils/Utils";
import {MuteModel} from "../../../model/DB/autoMod/impl/Mute.model";
import {NotBot} from "../../../guards/NotABot";
import {secureCommand} from "../../../guards/RoleConstraint";
import {GuildMember} from "discord.js";
import {RolePersistenceModel} from "../../../model/DB/autoMod/impl/RolePersistence.model";
import {MuteSingleton} from "./MuteSingleton";
import {AbstractCommandModule} from "../../AbstractCommandModule";
import TIME_UNIT = TimeUtils.TIME_UNIT;

@Discord()
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
                                optional: true,
                                type: "number",
                                description: "timeout in seconds for how long this user should be muted. \n you can also use the time unit at the end of the number to use other time units"
                            }
                        ]
                    }
                },
                {
                    name: "muteTimeUnits",
                    description: {
                        text: "Get all the available time units you can use in mute"
                    }
                },
                {
                    name: "viewAllMutes",
                    description: {
                        text: "View all the currently active mutes"
                    }
                }
            ]
        });
    }

    @SimpleCommand("mute")
    @Guard(NotBot, secureCommand)
    private async mute(command: CommandMessage): Promise<void> {
        const mutedRole = await GuildUtils.RoleUtils.getMuteRole(command.guild.id);
        if (!mutedRole) {
            command.reply("This command has not been configured or is disabled");
        }
        const argumentArray = StringUtils.splitCommandLine(command.content);
        if (argumentArray.length !== 3 && argumentArray.length !== 2) {
            command.reply(`Command arguments wrong, usage: ~mute <"username"> <"reason"> [timeout in seconds]`);
            return;
        }
        const [, reason, timeout] = argumentArray;
        const creatorID = command.member.id;
        const mentionedUserCollection = command.mentions.users;
        const mentionedMember: GuildMember = command.mentions.members.values().next().value;
        if (mentionedUserCollection.size !== 1) {
            command.reply("You must specify ONE user in your arguments");
            return;
        }
        const blockedUserId = mentionedUserCollection.keys().next().value;
        const blockUserObject = mentionedUserCollection.get(blockedUserId);
        const didYouBlockABot = blockUserObject.bot;
        const canBlock = await DiscordUtils.canUserPreformBlock(command);
        const bot = await DiscordUtils.getBot(command.guild.id);
        const botRole = bot.roles.highest;
        if (botRole.position <= mentionedMember.roles.highest.position) {
            command.reply("You can not block a member whose role is above or on the same level as this bot!");
            return;
        }

        if (creatorID == blockedUserId) {
            command.reply("You can not block yourself!");
            return;
        }

        if (!canBlock) {
            command.reply("You can not block a member whose role is above or on the same level as yours!");
            return;
        }
        if (didYouBlockABot) {
            command.reply("You can not block a bot");
            return;
        }

        const hasTimeout = ObjectUtil.validString(timeout);
        let replyMessage = `User "${mentionedMember.user.username}" has been muted from this server with reason "${reason}"`;
        try {
            if (hasTimeout) {
                let seconds = -1;
                if (ObjectUtil.isNumeric(timeout)) {
                    seconds = Number.parseInt(timeout);
                    await MuteSingleton.instance.muteUser(mentionedMember, reason, creatorID, seconds);
                } else {
                    const unit = timeout.replace(/\d+/, "");
                    const numberValueStr = timeout.slice(0, -unit.length);
                    const timeEnum = EnumEx.loopBack(TIME_UNIT, unit, true) as TIME_UNIT;
                    if (!ObjectUtil.validString(timeEnum)) {
                        command.reply(`invalid unit, '${unit}', available values are: \n ${this.getMuteTimeOutStr()}`);
                        return;
                    }
                    const numValue = Number.parseInt(numberValueStr);
                    await MuteSingleton.instance.muteUser(mentionedMember, reason, creatorID, numValue, timeEnum);
                    seconds = TimeUtils.convertToMilli(numValue, timeEnum) / 1000;
                }

                replyMessage += ` for ${ObjectUtil.secondsToHuman(seconds)}`;
            } else {
                await MuteSingleton.instance.muteUser(mentionedMember, reason, creatorID);
            }
        } catch (e) {
            command.reply(e.message);
            return;
        }

        command.reply(replyMessage);

    }

    private getMuteTimeOutStr(): string {
        const keyValuePair: Array<{ name: TIME_UNIT, value: string }> = EnumEx.getNamesAndValues(TIME_UNIT) as Array<{ name: TIME_UNIT, value: string }>;
        return keyValuePair.map(kv => {
            const {name, value}: { name: TIME_UNIT, value: string } = kv;
            return `'${value}' -> ${name}`;
        }).join("\n ");
    }

    @SimpleCommand("muteTimeUnits")
    @Guard(NotBot, secureCommand)
    private async getTimeUnits(command: CommandMessage): Promise<void> {
        command.reply(`\n ${this.getMuteTimeOutStr()}`);
    }

    @SimpleCommand("viewAllMutes")
    @Guard(NotBot, secureCommand)
    private async viewAllMutes(command: CommandMessage): Promise<MuteModel[]> {
        const currentBlocks = await MuteModel.findAll({
            where: {
                guildId: command.guild.id
            }
        });
        if (currentBlocks.length === 0) {
            command.reply("No members are muted");
            return;
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
        command.reply(replyStr);
        return currentBlocks;
    }
}