import {Command, CommandMessage, Description, Guard} from "@typeit/discord";
import {DiscordUtils, ObjectUtil, StringUtils} from "../../../utils/Utils";
import {MuteModel} from "../../../model/DB/autoMod/impl/Mute.model";
import {BaseDAO} from "../../../DAO/BaseDAO";
import {NotBot} from "../../../guards/NotABot";
import {roleConstraints} from "../../../guards/RoleConstraint";
import {Roles} from "../../../enums/Roles";
import {BlockGuard} from "../../../guards/BlockGuard";
import {GuildMember} from "discord.js";
import {RolePersistenceModel} from "../../../model/DB/autoMod/impl/RolePersistence.model";
import {MuteSingleton} from "./MuteSingleton";
import RolesEnum = Roles.RolesEnum;

export abstract class Mute extends BaseDAO<MuteModel | RolePersistenceModel> {

    @Command("mute")
    @Description(Mute.getMuteDescription())
    @Guard(NotBot, roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE), BlockGuard)
    private async mute(command: CommandMessage): Promise<void> {
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

        const botRole = await Roles.getRole(RolesEnum.VIC_BOT);
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

        const hasTimeout = ObjectUtil.validString(timeout) && !Number.isNaN(Number.parseInt(timeout));
        let replyMessage = `User "${mentionedMember.user.username}" has been muted from this server with reason "${reason}"`;
        try {
            if (hasTimeout) {
                const seconds = Number.parseInt(timeout);
                await MuteSingleton.instance.muteUser(mentionedMember, reason, creatorID, seconds);
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


    @Command("viewAllMutes")
    @Description(Mute.getViewAllMuteDescription())
    @Guard(NotBot, roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE), BlockGuard)
    private async viewAllMutes(command: CommandMessage): Promise<MuteModel[]> {
        const currentBlocks = await MuteModel.findAll();
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

    private static getViewAllMuteDescription() {
        return "View all the currently active mutes";
    }

    private static getMuteDescription() {
        return `\n Block a user from sending any messages with reason \n usage: ~mute <"username"> <"reason"> [timeout in seconds] \n example: ~mute "@SomeUser" "annoying" 20 \n make sure that the @ is blue before sending`;
    }
}