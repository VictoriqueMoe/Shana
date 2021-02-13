import {Command, CommandMessage, Description, Guard} from "@typeit/discord";
import {DiscordUtils, ObjectUtil, StringUtils} from "../../../utils/Utils";
import {MuteModel} from "../../../model/DB/autoMod/Mute.model";
import {BaseDAO} from "../../../DAO/BaseDAO";
import {NotBot} from "../../../guards/NotABot";
import {roleConstraints} from "../../../guards/RoleConstraint";
import {Roles} from "../../../enums/Roles";
import {BlockGuard} from "../../../guards/BlockGuard";
import {Guild, GuildMember, TextChannel, User} from "discord.js";
import RolesEnum = Roles.RolesEnum;
import Timeout = NodeJS.Timeout;
import {RolePersistenceModel} from "../../../model/DB/autoMod/RolePersistence.model";
import {WeebBot} from "../../../discord/WeebBot";
import {OnReady} from "../../../events/OnReady";
import {RemoveMuteBlock} from "./removeMuteBlock";

export abstract class AddMuteLock extends BaseDAO<MuteModel | RolePersistenceModel> {

    private static _timeOutMap: Map<User, Timeout> = new Map<User, Timeout>();

    private constructor() {
        super();
        AddMuteLock._timeOutMap = new Map();
    }

    @Command("mute")
    @Description(AddMuteLock.getDescription())
    @Guard(NotBot, roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE), BlockGuard)
    private async mute(command: CommandMessage): Promise<void> {
        let argumentArray = StringUtils.splitCommandLine(command.content);
        if (argumentArray.length !== 3 && argumentArray.length !== 2) {
            command.reply(`Command arguments wrong, usage: ~mute <"username"> <"reason"> [timeout in seconds]`);
            return;
        }
        let [, reason, timeout] = argumentArray;
        let creatorID = command.member.id;
        let mentionedUserCollection = command.mentions.users;
        let mentionedMember: GuildMember = command.mentions.members.values().next().value;
        if (mentionedUserCollection.size !== 1) {
            command.reply("You must specify ONE user in your arguments");
            return;
        }
        let blockedUserId = mentionedUserCollection.keys().next().value;
        let blockUserObject = mentionedUserCollection.get(blockedUserId);
        let didYouBlockABot = blockUserObject.bot;
        let canBlock = await DiscordUtils.canUserPreformBlock(command);

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
        let prevRolesArr = Array.from(mentionedMember.roles.cache.values());
        let prevRolesIdStr = prevRolesArr.map(r => r.id).join(",");

        let obj = {
            userId: blockedUserId,
            reason,
            creatorID,
            prevRole: prevRolesIdStr
        };
        let hasTimeout = ObjectUtil.validString(timeout) && !Number.isNaN(Number.parseInt(timeout));
        if (hasTimeout) {
            obj["timeout"] = (Number.parseInt(timeout) * 1000);
        }
        let model = new MuteModel(obj);
        let userObject: GuildMember = null;
        let savedModel: MuteModel = null;
        try {
            savedModel = await OnReady.dao.transaction(async t => {
                let m = await super.commitToDatabase(model) as MuteModel;
                userObject = await command.guild.members.fetch(m.userId);
                await this.addRolePersist(userObject);
                return m;
            }) as MuteModel;
        } catch {
            return;
        }
        await userObject.roles.remove([...userObject.roles.cache.keys()]);
        await userObject.roles.add(RolesEnum.MUTED);
        let replyMessage = `User "${userObject.user.username}" has been muted from this server with reason "${savedModel.reason}"`;
        if (hasTimeout) {
            let timeOutSec = Number.parseInt(timeout);
            let millis = timeOutSec * 1000;
            AddMuteLock.createTimeout(blockUserObject, millis, command.guild);
            replyMessage += ` for ${ObjectUtil.secondsToHuman(timeOutSec)}`;
        }
        command.reply(replyMessage);

    }

    private addRolePersist(user: GuildMember): Promise<RolePersistenceModel> {
        return super.commitToDatabase(new RolePersistenceModel({
            "userId": user.id,
            "roleId": RolesEnum.MUTED
        })) as Promise<RolePersistenceModel>;
    }

    public static get timeOutMap(): Map<User, Timeout> {
        return AddMuteLock._timeOutMap;
    }


    public static createTimeout(user: User, millis: number, guild: Guild): void {
        let timeOut: Timeout = setTimeout(async (member: User) => {
            await OnReady.dao.transaction(async t => {
                await RemoveMuteBlock.doRemove(user.id);
            });
            DiscordUtils.postToLog(`User ${member.username} has been unblocked after timeout`);
        }, millis, user);
        AddMuteLock._timeOutMap.set(user, timeOut);
    }

    private static getDescription() {
        return `\n Block a user from sending any messages with reason \n usage: ~mute <"username"> <"reason"> [timeout in seconds] \n example: ~mute "@SomeUser" "annoying" 20 \n make sure that the @ is blue before sending`;
    }
}