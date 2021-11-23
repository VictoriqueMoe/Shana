import {GuildMember, Role} from "discord.js";
import {MemberRoleChange} from "../../../modules/automod/MemberRoleChange.js";
import {RolePersistenceModel} from "../../../model/DB/autoMod/impl/RolePersistence.model.js";
import {singleton} from "tsyringe";
import {getRepository} from "typeorm";
import {BaseDAO} from "../../../DAO/BaseDAO.js";
import {DiscordUtils} from "../../../utils/Utils.js";

@singleton()
export class RoleApplier {

    /**
     * Give a role to a user
     * @param role
     * @param member
     * @param reason
     * @protected
     */
    public async applyRole(role: Role, member: GuildMember, reason?: string): Promise<void> {
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
    public async onChange(role: Role, change: MemberRoleChange, model: typeof RolePersistenceModel): Promise<boolean> {
        const isRoleRemoved = change.roleChanges.remove.includes(role.id);
        const userId = change.newUser.id;
        const roleId = role.id;
        if (isRoleRemoved) {
            const repo = getRepository(model);
            const rowCount = await repo.delete({
                userId,
                roleId,
                guildId: change.newUser.guild.id
            });
            return rowCount.affected > 0;
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
    public async roleJoins(role: Role, member: GuildMember, model: typeof RolePersistenceModel): Promise<boolean> {
        const userId = member.user.id;
        const repo = getRepository(model);
        const res = await repo.findOne({
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
    public async roleLeaves(role: Role, member: GuildMember, model: typeof RolePersistenceModel): Promise<RolePersistenceModel> {
        const roleId = role.id;
        const hasRole = member.roles.cache.has(roleId);
        if (!hasRole) {
            return;
        }
        const guildId = member.guild.id;
        const userId = member.user.id;
        await DiscordUtils.postToLog(`member ${member.user.tag} left the guild while having the role of ${role.name}`, guildId);
        return BaseDAO.build(model, {
            userId,
            roleId,
            guildId
        });
    }
}