import {GuildMember, Role, User} from "discord.js";
import {MemberRoleChange} from "../../../modules/automod/MemberRoleChange";
import {RolePersistenceModel} from "../../../model/DB/autoMod/impl/RolePersistence.model";
import {DiscordUtils} from "../../../utils/Utils";

export abstract class AbstractRoleApplier {

    /**
     * Give a role to a user
     * @param role
     * @param member
     * @param reason
     * @protected
     */
    protected async applyRole(role: Role, member: GuildMember, reason?: string): Promise<void> {
        await member.roles.add(role, reason);
    }

    /**
     * Will, when called check if a role has been removed, and if it has, will check if that role is stored in the role persistence table, if it is, then it is removed from the db
     * If ANY role was changed because of Dyno, AMD the any role is stored in the persistence table for that user, this will remove the role dyno gave it
     * @param role
     * @param change
     * @param model
     * @protected
     */
    protected async onChange(role: Role, change: MemberRoleChange, model: typeof RolePersistenceModel): Promise<boolean> {
        const isRoleRemoved = change.roleChanges.remove.includes(role.id);
        const userId = change.newUser.id;
        const roleId = role.id;
        if (isRoleRemoved) {
            const rowCount = await model.destroy({
                where: {
                    userId,
                    roleId,
                    guildId: change.newUser.guild.id
                }
            });
            return rowCount > 0;
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
    protected async roleJoins(role: Role, member: GuildMember, model: typeof RolePersistenceModel): Promise<boolean> {
        const userId = member.user.id;
        const res = await model.findOne({
            where: {
                userId,
                roleId: role.id,
                guildId: member.guild.id
            }
        });
        if (res) {
            await this.applyRole(role, member);
            return true;
        }
        return false;
    }

    /**
     * When called, This will check the the logs to see if the user left or was kicked, if left, and they have the role supplied, this will return a populated RolePersistenceModel object
     * @param role
     * @param member
     * @param model
     * @protected
     */
    protected async roleLeaves(role: Role, member: GuildMember, model: typeof RolePersistenceModel): Promise<RolePersistenceModel> {
        const roleId = role.id;
        const hasRole = member.roles.cache.has(roleId);
        if (!hasRole) {
            return;
        }
        // at this point we KNOW the member is special AND they left, but we do not know if they left voluntary or was kicked
        // we need to look at the audit logs
        const kickLog = await DiscordUtils.getAuditLogEntry("MEMBER_KICK", member.guild);
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
            const roleObj = member.roles.cache.get(roleId);
            // they where in special, but left on choice, this is now logged into the DB if they return
            console.log(`member ${member.user.username} left the guild while having the role of ${roleObj.name}`);
            return new model({
                userId: member.user.id,
                roleId,
                guildId: member.guild.id
            });
        }
        return null;
    }
}