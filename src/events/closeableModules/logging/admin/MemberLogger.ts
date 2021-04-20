import {ArgsOf, Client, Guard, On} from "@typeit/discord";
import {EnabledGuard} from "../../../../guards/EnabledGuard";
import {MessageEmbed, User} from "discord.js";
import {DiscordUtils, ObjectUtil} from "../../../../utils/Utils";
import {Roles} from "../../../../enums/Roles";
import {AbstractAdminAuditLogger} from "./AbstractAdminAuditLogger";
import RolesEnum = Roles.RolesEnum;

/**
 * admin audit Logger for Admin Audit logging. this will log:
 * Member join
 * Member ban
 * Member kick
 * Member leave
 * Member unBanned
 */
export class MemberLogger extends AbstractAdminAuditLogger {

    private static _uid = ObjectUtil.guid();

    constructor() {
        super(MemberLogger._uid);
    }

    @On("guildBanRemove")
    @Guard(EnabledGuard("AdminLog"))
    private async banRemoved([guild, user]: ArgsOf<"guildBanRemove">, client: Client): Promise<void> {
        const memberBannedId = user.id;
        const MemberBannedTag = user.tag;
        const avatarUrl = user.displayAvatarURL({format: 'jpg'});
        const auditEntry = await DiscordUtils.getAuditLogEntry("MEMBER_BAN_REMOVE", guild);
        const embed = new MessageEmbed()
            .setColor('#337FD5')
            .setTitle('Member Unbanned')
            .setAuthor(`Member Unbanned`, avatarUrl)
            .setDescription(`<@${memberBannedId}> ${MemberBannedTag}`)
            .setThumbnail(avatarUrl)
            .setTimestamp()
            .setFooter(`${user.id}`);
        if (auditEntry && auditEntry.target instanceof User && auditEntry.target.id === memberBannedId) {
            embed.addField("ban Removed By", auditEntry.executor.tag);
        }
        super.postToLog(embed, guild.id);
    }

    @On("guildMemberAdd")
    @Guard(EnabledGuard("AdminLog"))
    private async memberJoins([member]: ArgsOf<"guildMemberAdd">, client: Client): Promise<void> {
        const memberJoinedId = member.id;
        const memberJoinedTag = member.user.tag;
        const avatarUrl = member.user.displayAvatarURL({format: 'jpg'});
        const userJoinEmbed = new MessageEmbed()
            .setColor('#43B581')
            .setTitle('Member Joined')
            .setAuthor(`Member Joined`, avatarUrl)
            .setDescription(`<@${memberJoinedId}> ${memberJoinedTag}`)
            .setThumbnail(avatarUrl)
            .addFields(
                {name: 'Account Age', value: DiscordUtils.getAccountAge(member, true)},
            )
            .setTimestamp()
            .setFooter(`${member.id}`);
        super.postToLog(userJoinEmbed, member.guild.id);
    }

    @On("guildMemberRemove")
    @Guard(EnabledGuard("AdminLog"))
    private async memberLeaves([member]: ArgsOf<"guildMemberAdd">, client: Client): Promise<void> {
        const guild = member.guild;
        const banLog = await DiscordUtils.getAuditLogEntry("MEMBER_BAN_ADD", guild);
        if (banLog) {
            // do not bother to log a member leaving if they where banned
            const target = banLog.target;
            if (target instanceof User) {
                if (target.id === member.id) {
                    if (banLog.createdAt >= member.joinedAt) {
                        return;
                    }
                }
            }
        }
        const memberJoinedId = member.id;
        const memberJoinedTag = member.user.tag;
        const avatarUrl = member.user.displayAvatarURL({format: 'jpg'});
        const roles = member.roles.cache;
        const kickLog = await DiscordUtils.getAuditLogEntry("MEMBER_KICK", guild);
        let userJoinEmbed: MessageEmbed = null;
        let wasKicked = false;
        if (kickLog) {
            const target = kickLog.target;
            if (target instanceof User) {
                if (target.id === member.id) {
                    // check the date of the audit log incase someone was kicked, joins and leaves again, if you do not check the time, it will think the old left over log is the new one and treat the leave as a kick
                    if (kickLog.createdAt >= member.joinedAt) {
                        wasKicked = true;
                    }
                }
            }
        }
        const rolesArr = roles.filter(r => r.id !== RolesEnum.EVERYONE).map(role => `<@&${role.id}>`);
        if (wasKicked) {
            userJoinEmbed = new MessageEmbed()
                .setColor('#FF470F')
                .setTitle('Member Was Kicked')
                .setAuthor(`Member Kicked`, avatarUrl)
                .setDescription(`<@${memberJoinedId}> ${memberJoinedTag}`)
                .setThumbnail(avatarUrl)
                .addFields({
                        name: "Kicked by",
                        value: kickLog.executor.tag
                    },
                    {
                        name: "Reason",
                        value: ObjectUtil.validString(kickLog.reason) ? kickLog.reason : "No reason provided"
                    })
                .setTimestamp()
                .setFooter(`${member.id}`);
        } else {
            userJoinEmbed = new MessageEmbed()
                .setColor('#FF470F')
                .setTitle('Member Left')
                .setAuthor(`Member Left`, avatarUrl)
                .setDescription(`<@${memberJoinedId}> ${memberJoinedTag}`)
                .setThumbnail(avatarUrl)
                .setTimestamp()
                .setFooter(`${member.id}`);
        }
        if (rolesArr.length > 0) {
            userJoinEmbed = userJoinEmbed.addFields(
                {
                    name: 'Roles',
                    value: rolesArr.join(", ")
                }
            );
        }
        super.postToLog(userJoinEmbed, member.guild.id);
    }

    @On("guildBanAdd")
    @Guard(EnabledGuard("AdminLog"))
    private async memberBanned([guild, user]: ArgsOf<"guildBanAdd">, client: Client): Promise<void> {

        const avatarUrl = user.displayAvatarURL({format: 'jpg'});
        const userBanned = new MessageEmbed()
            .setColor('#FF470F')
            .setTitle('Member banned')
            .setAuthor(`Member banned`, avatarUrl)
            .setDescription(`<@${user.id}> ${user.username}`)
            .setThumbnail(avatarUrl)
            .setTimestamp()
            .setFooter(`${user.id}`);
        const res = await DiscordUtils.getAuditLogEntry("MEMBER_BAN_ADD", guild);
        if (res) {
            if (user.id === res.id) {
                userBanned.addFields(
                    {
                        name: "Banned by",
                        value: res.executor.tag
                    },
                    {
                        name: "Reason",
                        value: ObjectUtil.validString(res.reason) ? res.reason : "No reason provided"
                    }
                );
            }
        }
        super.postToLog(userBanned, guild.id);
    }
}