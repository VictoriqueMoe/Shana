import {Roles} from "../../../enums/Roles";
import {GuildMember, User} from "discord.js";
import {UserChange} from "../../../modules/automod/UserChange";
import {RolePersistenceModel} from "../../../model/DB/autoMod/impl/RolePersistence.model";
import {GuildUtils} from "../../../utils/Utils";
import RolesEnum = Roles.RolesEnum;

export abstract class AbstractRoleApplier<T extends RolesEnum> {

    /**
     * Give a role to a user
     * @param role
     * @param member
     * @protected
     */
    protected async applyRole(role: T, member: GuildMember): Promise<void> {
        await member.roles.add(role);
    }

    private async applyAfterDyno(role: T, member: GuildMember): Promise<void> {
        // step 1 get the last role edit
        let fetchedLogs = null;
        try {
            fetchedLogs = await member.guild.fetchAuditLogs({
                limit: 1,
                type: 'MEMBER_ROLE_UPDATE'
            });
        } catch (e) {
            //   console.error(e);
        }
        if (!fetchedLogs) {
            return;
        }
        const roleLog = fetchedLogs.entries.first();
        // get the executor of the role edit
        const executor = roleLog.executor;

        // is the executor dyno AND was it headcrab?
        const wasDyno = GuildUtils.getAutoBotIds().includes(executor.id);
        if (wasDyno) {
            const wasHeadCrab = member.roles.cache.has(RolesEnum.HEADCRABS);
            if (wasHeadCrab) {
                // remove it
                try {
                    await member.roles.remove(RolesEnum.HEADCRABS);
                } catch (e) {
                    console.error(e);
                }
            }
        }
    }

    /**
     * Will, when called check if a role has been removed, and if it has, will check if that role is stored in the role persistence table, if it is, then it is removed from the db
     * If ANY role was changed because of Dyno, AMD the any role is stored in the persistence table for that user, this will remove the role dyno gave it
     * @param role
     * @param change
     * @param model
     * @protected
     */
    protected async onChange(role: T, change: UserChange, model: typeof RolePersistenceModel): Promise<boolean> {
        const isRoleRemoved = change.roleChanges.remove.includes(role);
        // let specialRemoved = member.roles.cache.get(role) != null && member.roles.cache.get(role) == null;
        const userId = change.newUser.id;
        if (isRoleRemoved) {
            const rowCount = await model.destroy({
                where: {
                    userId,
                    roleId: role
                }
            });
            return rowCount > 0;
        }

        const dbEntry = await model.findOne({
            where: {
                userId,
                roleId: role
            }
        });
        if (dbEntry) {
            await this.applyAfterDyno(role, change.newUser as GuildMember);
        }
        return false;
    }

    /**
     * when called, this will check to see if the member exists in the database, and if so, will apply that role. will return true if this user was found and role applied
     * @param role
     * @param member
     * @param model
     * @protected
     */
    protected async roleJoins(role: T, member: GuildMember, model: typeof RolePersistenceModel): Promise<boolean> {
        const userId = member.user.id;
        const res = await model.findOne({
            where: {
                userId,
                roleId: role
            }
        });
        if (res) {
            await this.applyRole(role, member);
            return true;
        }
        return false;
    }

    /**
     * When called, This will check the the logs to see if the user left or was kicked, if left, and they have the role supplied, they will be put in the RolePersistenceModel table
     * @param role
     * @param member
     * @param model
     * @protected
     */
    protected async roleLeaves(role: T, member: GuildMember, model: typeof RolePersistenceModel): Promise<RolePersistenceModel> {
        const hasRole = member.roles.cache.has(role);
        if (!hasRole) {
            return;
        }
        // at this point we KNOW the member is special AND they left, but we do not know if they left voluntary or was kicked
        // we need to look at the audit logs
        const fetchedLogs = await member.guild.fetchAuditLogs({
            limit: 1,
            type: 'MEMBER_KICK',
        });

        const kickLog = fetchedLogs.entries.first();
        let wasKicked: boolean;
        if (!kickLog) {
            console.log(`${member.user.tag} left the guild, most likely of their own will.`);
            wasKicked = false;
        } else {
            if (kickLog.createdAt < member.joinedAt) {
                console.log(`${member.user.tag} left the guild, most likely of their own will or they where banned .`);
                wasKicked = false;
            } else {
                const {executor, target} = kickLog;
                if ((target as User).id === member.id) {
                    console.log(`${member.user.tag} left the guild; kicked by ${executor.tag}?`);
                    wasKicked = true;
                } else {
                    wasKicked = false;
                }
            }
        }

        if (!wasKicked) {
            const roleObj = member.roles.cache.get(role);
            // they where in special, but left on choice, this is now logged into the DB if they return
            console.log(`member ${member.user.username} left the guild while having the role of ${roleObj.name}`);
            return new model({
                "userId": member.user.id,
                "roleId": role
            });
        }
        return null;
    }
}