import {Command, CommandMessage, Description, Guard} from "@typeit/discord";
import {DiscordUtils, ObjectUtil, StringUtils} from "../../../utils/Utils";
import {MuteModel} from "../../../model/DB/autoMod/Mute.model";
import {BaseDAO} from "../../../DAO/BaseDAO";
import {NotBot} from "../../../guards/NotABot";
import {roleConstraints} from "../../../guards/RoleConstraint";
import {Roles} from "../../../enums/Roles";
import {BlockGuard} from "../../../guards/BlockGuard";
import RolesEnum = Roles.RolesEnum;
import {GuildMember, TextBasedChannel, TextChannel, User} from "discord.js";
import Timeout = NodeJS.Timeout;

export abstract class AddMuteLock extends BaseDAO<MuteModel> {

    private static _timeOutMap: Map<User, Map<number, Timeout>> = new Map<User, Map<number, Timeout>>();

    private constructor() {
        super();
        AddMuteLock._timeOutMap = new Map();
    }

    @Command("addMuteLock")
    @Description(AddMuteLock.getDescription())
    @Guard(NotBot, roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE), BlockGuard)
    private async addMuteLock(command: CommandMessage): Promise<MuteModel> {
        let argumentArray = StringUtils.splitCommandLine(command.content);
        if (argumentArray.length !== 3 && argumentArray.length !== 2) {
            command.reply(`Command arguments wrong, usage: ~addMuteLock <"username"> <"reason"> [timeout in seconds]`);
            return;
        }
        let [, reason, timeout] = argumentArray;
        let creatorID = command.member.id;
        let mentionedUserCollection = command.mentions.users;
        if (mentionedUserCollection.size !== 1) {
            command.reply("You must specify ONE user in your arguments");
            return;
        }
        let blockedUserId = mentionedUserCollection.keys().next().value;
        let blockUserObject = mentionedUserCollection.get(blockedUserId);
        let didYouBlockABot = blockUserObject.bot;
        let canBlock = await DiscordUtils.canUserPreformBlock(command);
        if (!canBlock) {
            command.reply("You can not block a member whose role is above yours!");
            return;
        }
        if (didYouBlockABot) {
            command.reply("You can not block a bot");
            return;
        }

        if (creatorID == blockedUserId) {
            command.reply("You can not block yourself!");
            return;
        }

        let obj = {
            userId: blockedUserId,
            reason,
            creatorID
        };

        let model = new MuteModel(obj);
        let savedModel = await super.commitToDatabase(model, command);
        let userObject = await command.guild.members.fetch(savedModel.userId);
        let replyMessage = `User ${userObject.user.username} has been muted from this guild with reason ${savedModel.reason}`;
        if (ObjectUtil.validString(timeout) && !Number.isNaN(Number.parseInt(timeout))) {
            let timeOutSec = Number.parseInt(timeout);
            let millis = timeOutSec * 1000;
            let timeOut: Timeout = setTimeout(async (member: User) => {
                await MuteModel.destroy({
                    where: {
                        userId: blockUserObject.id
                    }
                });
                let channel = await command.guild.channels.resolve("327484813336641536") as TextChannel; // logs channel
                //let channel = await command.guild.channels.resolve("793994947241312296") as TextChannel; // test channel
                channel.send(`User ${member.username} has been unblocked after timeout`);
                AddMuteLock._timeOutMap.delete(member);
            }, millis, blockUserObject);
            AddMuteLock._timeOutMap.set(blockUserObject, new Map([[timeOutSec, timeOut]]));
            replyMessage += ` for ${ObjectUtil.secondsToHuman(timeOutSec)}`;
        }
        command.reply(replyMessage);
        return savedModel;
    }

    private static getDescription() {
        return `\n Block a user from sending any messages with reason \n usage: ~addMuteLock <"username"> <"reason"> [timeout in seconds] \n example: ~addMuteLock "@SomeUser" "annoying" 20 \n make sure that the @ is blue before sending`;
    }

    public static get timeOutMap(): Map<User, Map<number, Timeout>> {
        return AddMuteLock._timeOutMap;
    }
}