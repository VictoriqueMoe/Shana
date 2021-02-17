import {Command, CommandMessage, Description, Guard} from "@typeit/discord";
import {DiscordUtils, GuildUtils, ObjectUtil, StringUtils} from "../../../utils/Utils";
import {MuteModel} from "../../../model/DB/autoMod/Mute.model";
import {BaseDAO} from "../../../DAO/BaseDAO";
import {NotBot} from "../../../guards/NotABot";
import {roleConstraints} from "../../../guards/RoleConstraint";
import {Roles} from "../../../enums/Roles";
import {BlockGuard} from "../../../guards/BlockGuard";
import {Guild, GuildMember, User} from "discord.js";
import {RolePersistenceModel} from "../../../model/DB/autoMod/RolePersistence.model";
import {OnReady} from "../../../events/OnReady";
import {Scheduler} from "../../../model/Scheduler";
import {IScheduledJob} from "../../../model/IScheduledJob";
import {Main} from "../../../Main";
import RolesEnum = Roles.RolesEnum;

export abstract class Mute extends BaseDAO<MuteModel | RolePersistenceModel> {
    private static _timeOutMap: Map<User, IScheduledJob> = new Map();

    private constructor() {
        super();
        Mute._timeOutMap = new Map();
    }

    @Command("mute")
    @Description(Mute.getMuteDescription())
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

        let botRole = await Roles.getRole(RolesEnum.VIC_BOT);
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


        let prevRolesArr = Array.from(mentionedMember.roles.cache.values());
        let prevRolesIdStr = prevRolesArr.map(r => r.id).join(",");

        let obj = {
            userId: blockedUserId,
            reason,
            creatorID,
            prevRole: prevRolesIdStr
        };
        let hasTimeout = ObjectUtil.validString(timeout) && !Number.isNaN(Number.parseInt(timeout));
        let millis = -1;
        let seconds = -1;
        let maxMillis = 8640000000000000 - Date.now();
        if (hasTimeout) {
            obj["timeout"] = (Number.parseInt(timeout) * 1000);
            seconds = Number.parseInt(timeout);
            millis = seconds * 1000;
            if (Number.isNaN(millis) || millis <= 0 || millis > maxMillis) {
                command.reply(`Timout is invalid, it can not be below 0 and can not be more than: "${maxMillis / 1000}"`);
                return;
            }
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
        try {
            await userObject.roles.remove([...userObject.roles.cache.keys()]);
        } catch {
            return;
        }
        await userObject.roles.add(RolesEnum.MUTED);
        let replyMessage = `User "${userObject.user.username}" has been muted from this server with reason "${savedModel.reason}"`;
        if (hasTimeout) {
            Mute.createTimeout(blockUserObject, millis, command.guild);
            replyMessage += ` for ${ObjectUtil.secondsToHuman(seconds)}`;
        }
        command.reply(replyMessage);

    }

    @Command("viewAllMutes")
    @Description(Mute.getViewAllMuteDescription())
    @Guard(NotBot, roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE), BlockGuard)
    private async viewAllMutes(command: CommandMessage): Promise<MuteModel[]> {
        let currentBlocks = await MuteModel.findAll();
        if (currentBlocks.length === 0) {
            command.reply("No members are muted");
            return;
        }
        let replyStr = `\n`;
        for (let block of currentBlocks) {
            let id = block.userId;
            let userObject = (await command.guild.members.fetch(id)).user;
            let creator = (await command.guild.members.fetch(block.creatorID)).user;
            let timeOutOrigValue = block.timeout;
            replyStr += `\n "${userObject.username}" has been muted by "${creator.username}" for the reason "${block.reason}"`;
            if (timeOutOrigValue > -1) {
                let now = Date.now();
                let dateCreated = (block.createdAt as Date).getTime();
                let timeLeft = timeOutOrigValue - (now - dateCreated);
                replyStr += `, for ${ObjectUtil.secondsToHuman(Math.round(timeOutOrigValue / 1000))} and has ${ObjectUtil.secondsToHuman(Math.round(timeLeft / 1000))} left`;
            }
            if (block.violationRules > 0) {
                replyStr += `, This user has also attempted to post ${block.violationRules} times while blocked`;
            }
        }
        command.reply(replyStr);
        return currentBlocks;
    }

    private addRolePersist(user: GuildMember): Promise<RolePersistenceModel> {
        return super.commitToDatabase(new RolePersistenceModel({
            "userId": user.id,
            "roleId": RolesEnum.MUTED
        })) as Promise<RolePersistenceModel>;
    }

    public static get timeOutMap(): Map<User, IScheduledJob> {
        return Mute._timeOutMap;
    }


    public static createTimeout(user: User, millis: number, guild: Guild): void {
        let now = Date.now();
        let future = now + millis;
        let newDate = new Date(future);
        let job = Scheduler.getInstance().register(user.id, newDate, async () => {
            await OnReady.dao.transaction(async t => {
                await Mute.doRemove(user.id);
            });
            DiscordUtils.postToLog(`User ${user.username} has been unblocked after timeout`);
        });
        Mute._timeOutMap.set(user, job);
    }

    public static async doRemove(userId: string, skipPersistence = false): Promise<void> {
        let whereClaus = {
            where: {
                userId
            }
        };
        let muteModel = await MuteModel.findOne(whereClaus);
        if (!muteModel) {
            throw new Error('That user is not currently muted.');
        }
        let prevRoles = muteModel.getPrevRoles();
        let rowCount = await MuteModel.destroy(whereClaus);
        if (rowCount != 1) {
            throw new Error('That user is not currently muted.');
        }
        if (!skipPersistence) {
            let persistenceModelRowCount = await RolePersistenceModel.destroy(whereClaus);
            if (persistenceModelRowCount != 1) {
                //the application has SHIT itself, if one table has an entry but the other not, fuck knows what to do here...
                throw new Error("Unknown error occurred, error is a synchronisation issue between the Persistence model and the Mute Model ");
            }
        }
        let timeoutMap = Mute.timeOutMap;
        let userToDelete: User = null;
        for (let [user, timeOutFunction] of timeoutMap) {
            if (user.id === userId) {
                console.log(`cleared timeout for ${user.id}`);
                Scheduler.getInstance().cancelJob(timeOutFunction.name);
                userToDelete = user;
            }
        }
        if (userToDelete) {
            Mute.timeOutMap.delete(userToDelete);
        }
        let guild = await Main.client.guilds.fetch(GuildUtils.getGuildID());
        let member = await guild.members.fetch(userId);
        await member.roles.remove(RolesEnum.MUTED);
        for (let roleEnum of prevRoles) {
            let role = await Roles.getRole(roleEnum);
            console.log(`re-applying role ${role.name} to ${member.user.username}`);
            await member.roles.add(role.id);
        }
    }


    private static getViewAllMuteDescription() {
        return "View all the currently active mutes";
    }


    private static getMuteDescription() {
        return `\n Block a user from sending any messages with reason \n usage: ~mute <"username"> <"reason"> [timeout in seconds] \n example: ~mute "@SomeUser" "annoying" 20 \n make sure that the @ is blue before sending`;
    }
}