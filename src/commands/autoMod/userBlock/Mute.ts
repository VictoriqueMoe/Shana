import {Command, CommandMessage, Description, Guard} from "@typeit/discord";
import {DiscordUtils, GuildUtils, ObjectUtil, StringUtils} from "../../../utils/Utils";
import {MuteModel} from "../../../model/DB/autoMod/impl/Mute.model";
import {BaseDAO} from "../../../DAO/BaseDAO";
import {NotBot} from "../../../guards/NotABot";
import {roleConstraints} from "../../../guards/RoleConstraint";
import {Roles} from "../../../enums/Roles";
import {BlockGuard} from "../../../guards/BlockGuard";
import {Guild, GuildMember} from "discord.js";
import {RolePersistenceModel} from "../../../model/DB/autoMod/impl/RolePersistence.model";
import {Scheduler} from "../../../model/Scheduler";
import {IScheduledJob} from "../../../model/IScheduledJob";
import {Main} from "../../../Main";
import RolesEnum = Roles.RolesEnum;

export class MuteSingleton extends BaseDAO<MuteModel | RolePersistenceModel> {
    private static _instance: MuteSingleton;

    private readonly _timeOutMap: Map<string, IScheduledJob> = new Map();

    private constructor() {
        super();
        this._timeOutMap = new Map();
    }

    public static get instance(): MuteSingleton {
        if (!MuteSingleton._instance) {
            MuteSingleton._instance = new MuteSingleton();
        }
        return MuteSingleton._instance;
    }

    private addRolePersist(user: GuildMember): Promise<RolePersistenceModel> {
        return super.commitToDatabase(new RolePersistenceModel({
            "userId": user.id,
            "roleId": RolesEnum.MUTED
        })) as Promise<RolePersistenceModel>;
    }

    public async muteUser(user: GuildMember, reason: string, creatorID: string, seconds?: number): Promise<MuteModel> {
        const prevRolesArr = Array.from(user.roles.cache.values());
        const prevRolesIdStr = prevRolesArr.map(r => r.id).join(",");
        const blockedUserId = user.id;
        const blockUserObject = user.user;
        const obj = {
            userId: blockedUserId,
            username: blockUserObject.username,
            reason,
            creatorID,
            prevRole: prevRolesIdStr
        };
        const hasTimeout = !Number.isNaN(seconds);
        const maxMillis = 8640000000000000 - Date.now();
        let millis = -1;
        if (hasTimeout) {
            millis = seconds * 1000;
            obj["timeout"] = seconds * 1000;
            if (Number.isNaN(millis) || millis <= 0 || millis > maxMillis) {
                throw new Error(`Timout is invalid, it can not be below 0 and can not be more than: "${maxMillis / 1000}"`);
            }
        }
        const model = new MuteModel(obj);
        let userObject: GuildMember = null;
        let savedModel: MuteModel = null;
        try {
            savedModel = await Main.dao.transaction(async t => {
                const m = await super.commitToDatabase(model) as MuteModel;
                userObject = await user.guild.members.fetch(m.userId);
                await this.addRolePersist(userObject);
                return m;
            }) as MuteModel;
        } catch {
            return null;
        }
        try {
            await userObject.roles.remove([...userObject.roles.cache.keys()]);
        } catch {
            return null;
        }
        await userObject.roles.add(RolesEnum.MUTED);
        if (hasTimeout) {
            MuteSingleton.instance.createTimeout(blockUserObject.id, blockUserObject.username, millis, user.guild);
        }
        return savedModel;
    }

    public async doRemove(userId: string, skipPersistence = false): Promise<void> {
        const whereClaus = {
            where: {
                userId
            }
        };
        const muteModel = await MuteModel.findOne(whereClaus);
        if (!muteModel) {
            throw new Error('That user is not currently muted.');
        }
        const prevRoles = muteModel.getPrevRoles();
        const rowCount = await MuteModel.destroy(whereClaus);
        if (rowCount != 1) {
            throw new Error('That user is not currently muted.');
        }
        if (!skipPersistence) {
            const persistenceModelRowCount = await RolePersistenceModel.destroy(whereClaus);
            if (persistenceModelRowCount != 1) {
                //the application has SHIT itself, if one table has an entry but the other not, fuck knows what to do here...
                throw new Error("Unknown error occurred, error is a synchronisation issue between the Persistence model and the Mute Model ");
            }
        }
        const timeoutMap = this.timeOutMap;
        let hasTimer = false;
        for (const [_userId, timeOutFunction] of timeoutMap) {
            if (userId === _userId) {
                console.log(`cleared timeout for ${_userId}`);
                Scheduler.getInstance().cancelJob(timeOutFunction.name);
                hasTimer = true;
            }
        }
        if (hasTimer) {
            this.timeOutMap.delete(userId);
        }
        const guild = await Main.client.guilds.fetch(GuildUtils.getGuildID());
        const member = await guild.members.fetch(userId);
        await member.roles.remove(RolesEnum.MUTED);
        for (const roleEnum of prevRoles) {
            const role = await Roles.getRole(roleEnum);
            console.log(`re-applying role ${role.name} to ${member.user.username}`);
            await member.roles.add(role.id);
        }
    }

    public get timeOutMap(): Map<string, IScheduledJob> {
        return this._timeOutMap;
    }

    public createTimeout(userId: string, username: string, millis: number, guild: Guild): void {
        const now = Date.now();
        const future = now + millis;
        const newDate = new Date(future);
        const job = Scheduler.getInstance().register(userId, newDate, async () => {
            await Main.dao.transaction(async t => {
                await MuteSingleton.instance.doRemove(userId);
            });
            DiscordUtils.postToLog(`User ${username} has been unblocked after timeout`);
        });
        // set the User ID to the job
        this._timeOutMap.set(userId, job);
    }

}

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
            replyStr += `\n "<@${id}>" has been muted by "<@${block.creatorID}>" for the reason "${block.reason}"`;
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