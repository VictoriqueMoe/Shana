import {BaseDAO} from "../../../DAO/BaseDAO";
import {MuteModel} from "../../DB/autoMod/impl/Mute.model";
import {RolePersistenceModel} from "../../DB/autoMod/impl/RolePersistence.model";
import {Guild, GuildMember} from "discord.js";
import {DiscordUtils, GuildUtils, ObjectUtil, TimeUtils} from "../../../utils/Utils";
import * as schedule from "node-schedule";
import {Job} from "node-schedule";
import {container, singleton} from "tsyringe";
import {GuildManager} from "./GuildManager";
import {Client} from "discordx";
import {PostConstruct} from "../../decorators/PostConstruct";
import {EntityManager, getRepository, IsNull, Not} from "typeorm";

@singleton()
export class MuteManager extends BaseDAO<MuteModel | RolePersistenceModel> {
    private readonly _mutes: Set<Job>;

    private readonly _repository = getRepository(MuteModel);

    public constructor(private _guildManager: GuildManager, private _client: Client) {
        super();
        this._mutes = new Set();
    }

    public async isMuted(user: GuildMember): Promise<boolean> {
        const mutedRole = await GuildUtils.RoleUtils.getMuteRole(user.guild.id);
        if (!mutedRole) {
            return false;
        }
        const muteRoleId = mutedRole.id;
        if (user.roles.cache.has(muteRoleId)) {
            return true;
        }

        for (const job of this._mutes) {
            if (job.name === user.id) {
                return true;
            }
        }

        const has = await this._repository.findOne({
            where: {
                userId: user.id,
                guildId: user.guild.id
            }
        });
        return !!has;
    }

    @PostConstruct
    private async initTimers(): Promise<void> {
        const mutesWithTimers = await this._repository.find({
            where: {
                timeout: Not(IsNull())
            }
        });
        const now = Date.now();
        const muteSingleton = container.resolve(MuteManager);
        for (const mute of mutesWithTimers) {
            const mutedRole = await GuildUtils.RoleUtils.getMuteRole(mute.guildId);
            if (!mutedRole) {
                continue;
            }
            const muteCreated = (mute.createdAt as Date).getTime();
            const timerLength = mute.timeout;
            const timeLeft = timerLength - (now - muteCreated);
            const guild: Guild = await this._client.guilds.fetch(mute.guildId);
            if (timeLeft <= 0) {
                console.log(`Timer has expired for user ${mute.username}, removing from database`);
                await this._repository.delete({
                    id: mute.id,
                    guildId: mute.guildId
                });
            } else {
                console.log(`Re-creating timed mute for ${mute.username}, time remaining is: ${ObjectUtil.timeToHuman(timeLeft)}`);
                muteSingleton.createTimeout(mute.userId, mute.username, timeLeft, guild);
            }
        }
    }

    /**
     * Mute a user from the server with an optional timeout
     * @param user - the User to mute
     * @param reason - reason for the mute
     * @param creatorID - User ID who did the mute
     * @param timeOut - the timeout. if unit is not passed, this will be evaluated as seconds
     * @param unit - the unit of time to apply to the timeOut argument
     */
    public async muteUser(user: GuildMember, reason: string, creatorID: string, timeOut?: number, unit?: TimeUtils.TIME_UNIT): Promise<MuteModel> {
        const mutedRole = await GuildUtils.RoleUtils.getMuteRole(user.guild.id);
        if (!mutedRole) {
            return;
        }
        if (await this.isMuted(user)) {
            return null;
        }
        const muteRoleId = mutedRole.id;
        const prevRolesArr = Array.from(user.roles.cache.values());
        const prevRolesIdStr = prevRolesArr.map(r => r.id).join(",");
        const blockedUserId = user.id;
        const blockUserObject = user.user;
        const obj = {
            userId: blockedUserId,
            username: blockUserObject.username,
            reason,
            creatorID,
            guildId: user.guild.id,
            prevRole: prevRolesIdStr
        };
        const hasTimeout = !isNaN(timeOut);
        const maxMillis = 8640000000000000 - Date.now();
        let millis = -1;
        if (hasTimeout) {
            millis = timeOut * 1000;
            if (ObjectUtil.validString(unit)) {
                millis = TimeUtils.convertToMilli(timeOut, unit);
            }
            if (Number.isNaN(millis) || millis <= 0 || millis > maxMillis) {
                throw new Error(`Timout is invalid, it can not be below 0 and can not be more than: "${maxMillis / 1000}"`);
            }
            obj["timeout"] = millis;
        }
        const model = BaseDAO.build(MuteModel, obj);
        let userObject: GuildMember = null;
        let savedModel: MuteModel = null;
        userObject = await user.guild.members.fetch(blockedUserId);
        try {
            savedModel = await this._repository.manager.transaction(async transactionManager => {
                const m = await super.commitToDatabase(transactionManager, [model], MuteModel);
                await this.addRolePersist(userObject, muteRoleId, transactionManager);
                return m[0];
            }) as MuteModel;
        } catch {
            return null;
        }
        for (const [roleId] of userObject.roles.cache) {
            try {
                await userObject.roles.remove(roleId);
            } catch {
            }
        }
        await userObject.roles.add(muteRoleId);
        if (hasTimeout) {
            this.createTimeout(blockUserObject.id, blockUserObject.username, millis, user.guild);
        }
        return savedModel;
    }

    public async unMute(user: GuildMember | string, guildId: string, skipPersistence: boolean = false, t?: EntityManager): Promise<void> {
        if (!t) {
            t = this._repository.manager;
        }
        const userId = typeof user === "string" ? user : user.id;
        const mutedRole = await GuildUtils.RoleUtils.getMuteRole(guildId);
        if (!mutedRole) {
            return;
        }
        const muteRoleId = mutedRole.id;
        const muteModel = await t.findOne(MuteModel, {
            where: {
                userId,
                guildId
            }
        });
        if (!muteModel) {
            throw new Error('That user is not currently muted.');
        }
        const prevRoles = await muteModel.getPrevRoles();
        const rowCount = await t.delete(MuteModel, {
            userId,
            guildId
        });
        if (rowCount.affected != 1) {
            throw new Error('That user is not currently muted.');
        }
        if (!skipPersistence) {
            const persistenceModelRowCount = await t.delete(MuteModel, {
                userId,
                guildId
            });
            if (persistenceModelRowCount.affected != 1) {
                //the application has SHIT itself, if one table has an entry but the other not, fuck knows what to do here...
                throw new Error("Unknown error occurred, error is a synchronisation issue between the Persistence model and the Mute Model ");
            }
        }
        let job: Job = null;
        for (const _job of this._mutes) {
            const {name} = _job;
            if (userId === name) {
                console.log(`cleared timeout for ${name}`);
                _job.cancel();
                job = _job;
            }
        }
        if (job) {
            this._mutes.delete(job);
        }
        const guild = await this._client.guilds.fetch(guildId);
        let member;
        try {
            member = await guild.members.fetch(userId);
        } catch {
            return;
        }
        await member.roles.remove(muteRoleId);

        for (const roleId of prevRoles) {
            const role = await (await this._guildManager.getGuild(guildId)).roles.fetch(roleId);
            console.log(`re-applying role ${role.name} to ${member.user.username}`);
            try {
                await member.roles.add(role.id);
            } catch {

            }
        }
        try {
            DiscordUtils.postToLog(`User: "<@${userId}>" has been un-muted`, guildId);
        } catch {
        }
    }

    public async getAllMutedMembers(guildId: string): Promise<MuteModel[]> {
        return await this._repository.find({
            where: {
                guildId
            }
        });
    }

    public createTimeout(userId: string, username: string, millis: number, guild: Guild): void {
        const now = Date.now();
        const future = now + millis;
        const newDate = new Date(future);
        for (const mute of this._mutes) {
            if (mute.name === userId) {
                return;
            }
        }
        try {
            const job = schedule.scheduleJob(userId, newDate, async () => {
                await this._repository.manager.transaction(async transactionManager => {
                    await this.unMute(userId, guild.id, false, transactionManager);
                });
                DiscordUtils.postToLog(`User ${username} has been unblocked after timeout`, guild.id);
            });
            this._mutes.add(job);
        } catch {
        }
    }

    private addRolePersist(user: GuildMember, muteRoleId: string, entityManager: EntityManager): Promise<RolePersistenceModel> {
        const newModel = BaseDAO.build(RolePersistenceModel, {
            "userId": user.id,
            "roleId": muteRoleId,
            guildId: user.guild.id
        });
        return super.commitToDatabase(entityManager, [newModel], RolePersistenceModel).then(values => values[0]) as Promise<RolePersistenceModel>;
    }
}