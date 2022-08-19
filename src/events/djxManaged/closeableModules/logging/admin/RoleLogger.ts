import {AuditLogEvent, EmbedBuilder, Role, User} from "discord.js";
import {DiscordUtils, ObjectUtil} from "../../../../../utils/Utils.js";
import {AbstractAdminAuditLogger} from "./AbstractAdminAuditLogger.js";
import {ArgsOf, Client, Discord, On} from "discordx";
import {MemberRoleChange} from "../../../../../model/impl/MemberRoleChange.js";
import {RoleLoggerSettings} from "../../../../../model/closeableModules/settings/AdminLogger/RoleLoggerSettings.js";
import {EventDeletedListener} from "../../../eventDispatcher/EventDeletedListener.js";

/**
 * Role Created<br/>
 * Role Deleted<br/>
 * Role Updated<br/>
 * Role Given<br/>
 * Role Removed<br/>
 */
@Discord()
export class RoleLogger extends AbstractAdminAuditLogger<RoleLoggerSettings> {

    public get moduleId(): string {
        return "RoleLogger";
    }

    public setDefaults(guildId: string): Promise<void> {
        return super.saveSettings(guildId, {
            roleCreated: false,
            roleDeleted: false,
            roleGiven: false,
            roleUpdated: false
        }, false, true);
    }

    @On({
        event: "guildMemberUpdate"
    })
    private async roleGiven([oldMember, newMember]: ArgsOf<"guildMemberUpdate">): Promise<void> {
        const enabled = await this.isEnabledInternal(newMember.guild.id, "roleGiven");
        if (!enabled) {
            return;
        }
        if (EventDeletedListener.isMemberRemoved(newMember)) {
            return;
        }
        const oldRolesMan = oldMember.roles;
        const newRolesMan = newMember.roles;
        const wasChange = oldRolesMan.cache.size !== newRolesMan.cache.size;
        if (!wasChange) {
            return;
        }
        if (newMember.roles.cache.size === 1 && newMember === newMember.guild.members.me) {
            return;
        }
        const avatarUrl = newMember.user.displayAvatarURL();
        const embed = new EmbedBuilder()
            .setAuthor({
                name: newMember.user.tag,
                iconURL: avatarUrl
            })
            .setTitle(`Role changed`)
            .setDescription(`<@${newMember.id}> has had their roles changed`)
            .setTimestamp()
            .setFooter({
                text: `${newMember.id}`
            });

        const change = new MemberRoleChange(oldMember, newMember);
        const roleChanges = change.roleChanges;
        const added = roleChanges.add;
        const guild = await DiscordUtils.getGuild(oldMember.guild.id);
        if (added.length > 0) {
            const arr = [];
            for (const roleId of added) {
                const roleObj = await guild.roles.fetch(roleId);
                embed.setColor(roleObj.hexColor);
                arr.push(`\`${roleObj.name}\``);
            }
            const str = arr.join(", ");
            embed.addFields(ObjectUtil.singleFieldBuilder("Added role(s)", str));
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
            embed.addFields(ObjectUtil.singleFieldBuilder("Removed role(s)", str));
        }

        const auditEntry = await this._auditManager.getAuditLogEntry(AuditLogEvent.MemberRoleUpdate, oldMember.guild);
        if (auditEntry) {
            const {executor, target} = auditEntry;
            if (target instanceof User) {
                if (target.id === newMember.id) {
                    embed.addFields(ObjectUtil.singleFieldBuilder("Modified by", executor.tag));
                }
            }
        }
        super.postToLog(embed, newMember.guild.id);
    }

    @On({
        event: "roleUpdate"
    })
    private async roleUpdated([oldRole, newRole]: ArgsOf<"roleUpdate">): Promise<void> {
        const enabled = await this.isEnabledInternal(newRole.guild.id, "roleUpdated");
        if (!enabled) {
            return;
        }
        const roleChange = this._guildInfoChangeManager.getRoleChanges(oldRole, newRole);
        const guildId = newRole.guild.id;
        if (!ObjectUtil.isValidObject(roleChange)) {
            return;
        }
        const embed = new EmbedBuilder()
            .setColor('#43B581')
            .setAuthor({
                name: this.getGuildName(guildId),
                iconURL: this.getGuildIconUrl(guildId)
            })
            .setTitle(`Role "${oldRole.name}" Changed`)
            .setTimestamp()
            .setFooter({
                text: `${newRole.id}`
            });
        const auditEntry = await this._auditManager.getAuditLogEntry(AuditLogEvent.RoleUpdate, newRole.guild);
        if (auditEntry) {
            const target = auditEntry.target as Role;
            if (target.id === newRole.id) {
                if (newRole.createdAt <= auditEntry.createdAt) {
                    const executor = auditEntry.executor;
                    const avatarUrl = executor.displayAvatarURL();
                    embed.setAuthor({
                        name: executor.tag,
                        iconURL: avatarUrl

                    });
                    embed.addFields(ObjectUtil.singleFieldBuilder("Changed by", executor.tag));
                }
            }
        }
        const permsChanges = roleChange.permissions;
        if (ObjectUtil.isValidObject(permsChanges)) {
            const addedStr = permsChanges.after.join(", ");
            if (ObjectUtil.validString(addedStr)) {
                embed.addFields(ObjectUtil.singleFieldBuilder("Added Permission(s)", addedStr));
            }
            const removedStr = permsChanges.before.join(", ");
            if (ObjectUtil.validString(removedStr)) {
                embed.addFields(ObjectUtil.singleFieldBuilder("Removed Permission(s)", removedStr));
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

    @On({
        event: "roleCreate"
    })
    private async roleCreated([role]: ArgsOf<"roleCreate">): Promise<void> {
        const enabled = await this.isEnabledInternal(role.guild.id, "roleCreated");
        if (!enabled) {
            return;
        }
        const roleAuditLogEntry = await this._auditManager.getAuditLogEntry(AuditLogEvent.RoleCreate, role.guild);
        const {target} = roleAuditLogEntry;
        const guildId = role.guild.id;
        const embed = new EmbedBuilder()
            .setColor(role.hexColor)
            .setAuthor({
                name: this.getGuildName(guildId),
                iconURL: this.getGuildIconUrl(guildId)
            })
            .setDescription(`Role Created: ${role.name}`)
            .setTimestamp()
            .setFooter({
                text: `${role.id}`
            });
        const executor = roleAuditLogEntry.executor;
        if (executor && target instanceof Role) {
            if (target.id === role.id) {
                if (role.createdAt <= roleAuditLogEntry.createdAt) {
                    embed.addFields(ObjectUtil.singleFieldBuilder("Role created by", executor.tag));
                }
            }
        }
        super.postToLog(embed, guildId);
    }

    @On({
        event: "roleDelete"
    })
    private async roleDeleted([role]: ArgsOf<"roleDelete">, client: Client): Promise<void> {
        const enabled = await this.isEnabledInternal(role.guild.id, "roleDeleted");
        if (!enabled) {
            return;
        }
        const me = client.guilds.cache.get(role.guild.id).members.me;
        if (me.roles.cache.size === 1) {
            return;
        }
        const guildId = role.guild.id;
        const roleAuditLogEntry = await this._auditManager.getAuditLogEntry(AuditLogEvent.RoleDelete, role.guild);
        const {executor, target} = roleAuditLogEntry;
        const embed = new EmbedBuilder()
            .setColor(role.hexColor)
            .setAuthor({
                name: this.getGuildName(guildId),
                iconURL: this.getGuildIconUrl(guildId)
            })
            .setDescription(`Role Deleted: "${role.name}"`)
            .setTimestamp()
            .setFooter({
                text: `${role.id}`
            });
        if (ObjectUtil.isValidObject(target)) {
            const targetRoleId = (target as { id: string }).id;
            if (targetRoleId === role.id) {
                if (role.createdAt <= roleAuditLogEntry.createdAt) {
                    embed.addFields(ObjectUtil.singleFieldBuilder("Role deleted by", executor.tag));
                }
            }
        }
        super.postToLog(embed, guildId);
    }

}
