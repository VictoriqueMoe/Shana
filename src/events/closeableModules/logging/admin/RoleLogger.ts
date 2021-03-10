import {DiscordUtils, GuildUtils, ObjectUtil} from "../../../../utils/Utils";
import {AbstractAdminAuditLogger} from "./AbstractAdminAuditLogger";
import {ArgsOf, Client, Guard, On} from "@typeit/discord";
import {EnabledGuard} from "../../../../guards/EnabledGuard";
import {MessageEmbed, Role} from "discord.js";

/**
 * Role Created
 * Role Deleted
 * Role Updated
 * Role Given
 * Role Removed
 */
export class RoleLogger extends AbstractAdminAuditLogger {
    private static _uid = ObjectUtil.guid();

    constructor() {
        super(RoleLogger._uid);
    }

    @On("roleUpdate")
    @Guard(EnabledGuard("AdminLog"))
    private async roleUpdated([oldRole, newRole]: ArgsOf<"roleUpdate">, client: Client): Promise<void> {
        const roleChange = DiscordUtils.getRoleChanges(oldRole, newRole);
        if (!ObjectUtil.isValidObject(roleChange)) {
            return;
        }
        const embed = new MessageEmbed()
            .setColor('#43B581')
            .setAuthor(GuildUtils.getGuildName(), GuildUtils.getGuildIconUrl())
            .setTitle(`Role "${oldRole.name}" Changed`)
            .setTimestamp()
            .setFooter(`${newRole.id}`);
        const auditEntry = await DiscordUtils.getAuditLogEntry("ROLE_UPDATE", newRole.guild);
        if (auditEntry) {
            const target = auditEntry.target as Role;
            if (target.id === newRole.id) {
                if (newRole.createdAt <= auditEntry.createdAt) {
                    const executor = auditEntry.executor;
                    const avatarUrl = executor.displayAvatarURL({format: 'jpg'});
                    embed.setAuthor(executor.tag, avatarUrl);
                    embed.addField("Changed by", executor.tag);
                }
            }
        }
        const permsChanges = roleChange.permissions;
        if (ObjectUtil.isValidObject(permsChanges)) {
            const addedStr = permsChanges.added.join(", ");
            if (ObjectUtil.validString(addedStr)) {
                embed.addField("Added Permission(s)", addedStr);
            }
            const removedStr = permsChanges.removed.join(", ");
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
        super.postToLog(embed);
    }

    @On("roleCreate")
    @Guard(EnabledGuard("AdminLog"))
    private async roleCreated([role]: ArgsOf<"roleCreate">, client: Client): Promise<void> {
        const roleAuditLogEntry = await DiscordUtils.getAuditLogEntry("ROLE_CREATE", role.guild);
        const {executor, target} = roleAuditLogEntry;

        const embed = new MessageEmbed()
            .setColor(role.hexColor)
            .setAuthor(GuildUtils.getGuildName(), GuildUtils.getGuildIconUrl())
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
        super.postToLog(embed);
    }

    @On("roleDelete")
    @Guard(EnabledGuard("AdminLog"))
    private async roleDeleted([role]: ArgsOf<"roleDelete">, client: Client): Promise<void> {
        const roleAuditLogEntry = await DiscordUtils.getAuditLogEntry("ROLE_DELETE", role.guild);
        const {executor, target} = roleAuditLogEntry;
        const embed = new MessageEmbed()
            .setColor(role.hexColor)
            .setAuthor(GuildUtils.getGuildName(), GuildUtils.getGuildIconUrl())
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
        super.postToLog(embed);
    }

}