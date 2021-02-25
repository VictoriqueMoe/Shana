import {BaseDAO} from "../../../DAO/BaseDAO";
import {MuteModel} from "../../../model/DB/autoMod/impl/Mute.model";
import {RolePersistenceModel} from "../../../model/DB/autoMod/impl/RolePersistence.model";
import {IScheduledJob} from "../../../model/IScheduledJob";
import {Guild, GuildMember} from "discord.js";
import {Main} from "../../../Main";
import {Scheduler} from "../../../model/Scheduler";
import {DiscordUtils, GuildUtils} from "../../../utils/Utils";
import {Roles} from "../../../enums/Roles";
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