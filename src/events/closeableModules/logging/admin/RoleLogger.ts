import {DiscordUtils, GuildUtils, ObjectUtil} from "../../../../utils/Utils";
import {AbstractAdminAuditLogger} from "./AbstractAdminAuditLogger";
import type {ArgsOf, Client} from "discordx";
import {Discord, On} from "discordx";
import {MessageEmbed, Role, User} from "discord.js";
import {MemberRoleChange} from "../../../../model/Impl/MemberRoleChange";
import {GuildManager} from "../../../../model/framework/manager/GuildManager";
import {container} from "tsyringe";


/**
 * Role Created<br/>
 * Role Deleted<br/>
 * Role Updated<br/>
 * Role Given<br/>
 * Role Removed<br/>
 */
@Discord()
export class RoleLogger extends AbstractAdminAuditLogger {

    @On("guildMemberUpdate")
    private async roleGiven([oldMember, newMember]: ArgsOf<"guildMemberUpdate">, client: Client): Promise<void> {
        const oldRolesMan = oldMember.roles;
        const newRolesMan = newMember.roles;
        const wasChange = oldRolesMan.cache.size !== newRolesMan.cache.size;
        if (!wasChange) {
            return;
        }
        const avatarUrl = newMember.user.displayAvatarURL({dynamic: true});
        const embed = new MessageEmbed()
            .setAuthor(newMember.user.tag, avatarUrl)
            .setTitle(`Role changed`)
            .setDescription(`<@${newMember.id}> has had their roles changed`)
            .setTimestamp()
            .setFooter(`${newMember.user.id}`);

        const change = new MemberRoleChange(oldMember, newMember);
        const roleChanges = change.roleChanges;
        const added = roleChanges.add;
        const guildManager = container.resolve(GuildManager);
        const guild = await guildManager.getGuild(oldMember.guild.id);
        if (added.length > 0) {
            const arr = [];
            for (const roleId of added) {
                const roleObj = await guild.roles.fetch(roleId);
                embed.setColor(roleObj.hexColor);
                arr.push(`\`${roleObj.name}\``);
            }
            const str = arr.join(", ");
            embed.addField("Added role(s)", str);
        }
        const removed = roleChanges.remove;
        if (removed.length > 0) {
            const arr = [];
            for (const roleId of removed) {
                const roleObj = await guild.roles.fetch(roleId);
                embed.setColor(roleObj.hexColor);
                arr.push(`\`${roleObj.name}\``);
            }
            const str = arr.join(", ");
            embed.addField("Removed role(s)", str);
        }

        const auditEntry = await DiscordUtils.getAuditLogEntry("MEMBER_ROLE_UPDATE", oldMember.guild);
        if (auditEntry) {
            const {executor, target} = auditEntry;
            if (target instanceof User) {
                if (target.id === newMember.id) {
                    embed.addField("Modified by", executor.tag);
                }
            }
        }
        super.postToLog(embed, newMember.guild.id);
    }

    @On("roleUpdate")
    private async roleUpdated([oldRole, newRole]: ArgsOf<"roleUpdate">, client: Client): Promise<void> {
        const roleChange = DiscordUtils.getRoleChanges(oldRole, newRole);
        const guildId = newRole.guild.id;
        if (!ObjectUtil.isValidObject(roleChange)) {
            return;
        }
        const embed = new MessageEmbed()
            .setColor('#43B581')
            .setAuthor(GuildUtils.getGuildName(guildId), GuildUtils.getGuildIconUrl(guildId))
            .setTitle(`Role "${oldRole.name}" Changed`)
            .setTimestamp()
            .setFooter(`${newRole.id}`);
        const auditEntry = await DiscordUtils.getAuditLogEntry("ROLE_UPDATE", newRole.guild);
        if (auditEntry) {
            const target = auditEntry.target as Role;
            if (target.id === newRole.id) {
                if (newRole.createdAt <= auditEntry.createdAt) {
                    const executor = auditEntry.executor;
                    const avatarUrl = executor.displayAvatarURL({dynamic: true});
                    embed.setAuthor(executor.tag, avatarUrl);
                    embed.addField("Changed by", executor.tag);
                }
            }
        }
        const permsChanges = roleChange.permissions;
        if (ObjectUtil.isValidObject(permsChanges)) {
            const addedStr = permsChanges.after.join(", ");
            if (ObjectUtil.validString(addedStr)) {
                embed.addField("Added Permission(s)", addedStr);
            }
            const removedStr = permsChanges.before.join(", ");
            if (ObjectUtil.validString(removedStr)) {
                embed.addField("Removed Permission(s)", removedStr);
            }
        }

        const nameChange = roleChange.nameChange;
        if (ObjectUtil.isValidObject(nameChange)) {
            const {before, after} = nameChange;
            embed.addFields([
                {
                    "name": "Old name",
                    "value": before
                },
                {
                    "name": "New name",
                    "value": after
                }
            ]);
        }
        const colourChange = roleChange.colourChange;
        if (ObjectUtil.isValidObject(colourChange)) {
            const {before, after} = colourChange;
            embed.addFields([
                {
                    "name": "Old colour",
                    "value": before
                },
                {
                    "name": "New colour",
                    "value": after
                }
            ]);
            embed.setColor(after);
        }

        const hoistChange = roleChange.hoist;
        if (ObjectUtil.isValidObject(hoistChange)) {
            const {before, after} = hoistChange;
            embed.addFields([
                {
                    "name": "Old hoist value",
                    "value": String(before)
                },
                {
                    "name": "New hoist value",
                    "value": String(after)
                }
            ]);
        }

        const {iconChange} = roleChange;
        if (ObjectUtil.isValidObject(iconChange)) {
            const {before, after} = iconChange;
            embed.addFields([
                {
                    "name": "Old icon url",
                    "value": before
                },
                {
                    "name": "New icon url",
                    "value": after
                }
            ]);
        }
        super.postToLog(embed, guildId);
    }

    @On("roleCreate")
    private async roleCreated([role]: ArgsOf<"roleCreate">, client: Client): Promise<void> {
        const roleAuditLogEntry = await DiscordUtils.getAuditLogEntry("ROLE_CREATE", role.guild);
        const {executor, target} = roleAuditLogEntry;
        const guildId = role.guild.id;
        const embed = new MessageEmbed()
            .setColor(role.hexColor)
            .setAuthor(GuildUtils.getGuildName(guildId), GuildUtils.getGuildIconUrl(guildId))
            .setDescription(`Role Created: ${role.name}`)
            .setTimestamp()
            .setFooter(`${role.id}`);
        if (target instanceof Role) {
            if (target.id === role.id) {
                if (role.createdAt <= roleAuditLogEntry.createdAt) {
                    embed.addField("Role created by", executor.tag);
                }
            }
        }
        super.postToLog(embed, guildId);
    }

    @On("roleDelete")
    private async roleDeleted([role]: ArgsOf<"roleDelete">, client: Client): Promise<void> {
        const guildId = role.guild.id;
        const roleAuditLogEntry = await DiscordUtils.getAuditLogEntry("ROLE_DELETE", role.guild);
        const {executor, target} = roleAuditLogEntry;
        const embed = new MessageEmbed()
            .setColor(role.hexColor)
            .setAuthor(GuildUtils.getGuildName(guildId), GuildUtils.getGuildIconUrl(guildId))
            .setDescription(`Role Deleted: "${role.name}"`)
            .setTimestamp()
            .setFooter(`${role.id}`);
        if (ObjectUtil.isValidObject(target)) {
            const targetRoleId = (target as { id: string }).id;
            if (targetRoleId === role.id) {
                if (role.createdAt <= roleAuditLogEntry.createdAt) {
                    embed.addField("Role deleted by", executor.tag);
                }
            }
        }
        super.postToLog(embed, guildId);
    }

}
