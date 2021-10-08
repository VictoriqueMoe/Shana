import {ArgsOf, Client, Discord, On} from "discordx";
import {MessageEmbed, User} from "discord.js";
import {DiscordUtils, ObjectUtil} from "../../../../utils/Utils";
import {Roles} from "../../../../enums/Roles";
import {AbstractAdminAuditLogger} from "./AbstractAdminAuditLogger";


/**
 * admin audit Logger for Admin Audit logging. this will log:
 * Member join
 * Member ban
 * Member kick
 * Member leave
 * Member unBanned
 * Member username changed
 * Member joins/leaves VC
 */
@Discord()
export class MemberLogger extends AbstractAdminAuditLogger {

    @On("voiceStateUpdate")
    private async voiceChannelChanged([oldState, newState]: ArgsOf<"voiceStateUpdate">, client: Client): Promise<void> {
        const {member} = newState;
        const {user} = member;
        const guildId = member.guild.id;
        const avatarUrl = user.displayAvatarURL({format: 'jpg'});
        const oldChannel = oldState.channelId;
        const newChannel = newState.channelId;
        const wasDisconnect = ObjectUtil.validString(oldChannel) && newChannel == null;
        const wasConnect = ObjectUtil.validString(newChannel) && oldChannel == null;
        const wasServerSwap = (oldChannel !== null && newChannel !== null) && newChannel !== oldChannel;
        const displayHexColor = member.displayHexColor;
        const embed = new MessageEmbed()
            .setColor(displayHexColor)
            .setAuthor(member.user.tag, avatarUrl)
            .setThumbnail(avatarUrl)
            .setTimestamp()
            .setFooter(`${user.id}`);
        if (wasServerSwap) {
            embed.setTitle("User changed voice channels");
            embed.setDescription(`<@${user.id}> has changed voice channels`);
            embed.addField("From", `<#${oldChannel}>`);
            embed.addField("To", `<#${newChannel}>`);
        } else if (wasDisconnect) {
            embed.setTitle("User disconnected from a voice channel");
            embed.setDescription(`<@${user.id}> has disconnected from a voice channel`);
            embed.addField("From", `<#${oldChannel}>`);
        } else if (wasConnect) {
            embed.setTitle("User connected to a voice channel");
            embed.setDescription(`<@${user.id}> has connected to a voice channel`);
            embed.addField("To", `<#${newChannel}>`);
        } else {
            return;
        }
        super.postToLog(embed, guildId);
    }

    @On("guildMemberUpdate")
    private async memeberDetailsChanged([oldUser, newUser]: ArgsOf<"guildMemberUpdate">, client: Client): Promise<void> {
        const {id, user} = newUser;
        const {tag} = user;
        const oldNickname = oldUser.nickname;
        const newNickname = newUser.nickname;
        const didNicknameChange = oldNickname !== newNickname;
        if (!didNicknameChange) {
            return;
        }
        const avatarUrl = user.displayAvatarURL({format: 'jpg'});
        const embed = new MessageEmbed()
            .setColor('#337FD5')
            .setTitle('Member Nickname changed')
            .setAuthor(tag, avatarUrl)
            .setThumbnail(avatarUrl)
            .setTimestamp()
            .setFooter(`${user.id}`);
        if (newNickname == null) {
            embed.setDescription("Nickname reset");
        } else {
            embed.setDescription("Nickname updated");
            embed.addField("Before", `${ObjectUtil.validString(oldUser.nickname) ? oldUser.nickname : "none"}`);
            embed.addField("After", newUser.nickname);
        }
        const auditEntry = await DiscordUtils.getAuditLogEntry("MEMBER_UPDATE", newUser.guild);
        if (auditEntry) {
            if (auditEntry.target instanceof User && auditEntry.target.id === id) {
                embed.addField("Nickname changed by", auditEntry.executor.tag);
            }
        }
        super.postToLog(embed, newUser.guild.id);
    }

    @On("guildBanRemove")
    private async banRemoved([ban]: ArgsOf<"guildBanRemove">, client: Client): Promise<void> {
        const {guild, reason, user} = ban;
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
            .addFields({
                name: 'Account Age',
                value: DiscordUtils.getAccountAge(member, true) as string
            })
            .setTimestamp()
            .setFooter(`${member.id}`);
        super.postToLog(userJoinEmbed, member.guild.id);
    }

    @On("guildMemberRemove")
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
        const rolesArr = roles.filter(r => r.name !== "@everyone").map(role => `<@&${role.id}>`);
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
    private async memberBanned([ban]: ArgsOf<"guildBanAdd">, client: Client): Promise<void> {
        if (ban.partial) {
            ban = await ban.fetch(true);
        }
        const {guild, reason, user} = ban;
        const avatarUrl = user.displayAvatarURL({format: 'jpg'});
        const userBanned = new MessageEmbed()
            .setColor('#FF470F')
            .setTitle('Member banned')
            .setAuthor(`Member banned`, avatarUrl)
            .setDescription(`<@${user.id}> ${user.tag}`)
            .setThumbnail(avatarUrl)
            .setTimestamp()
            .setFooter(`${user.id}`);
        const res = await DiscordUtils.getAuditLogEntry("MEMBER_BAN_ADD", guild);
        if (res) {
            const target = res.target;
            if (target instanceof User) {
                if (user.id === target.id) {
                    userBanned.addField("Banned by", res.executor.tag);
                }
            }
        }
        userBanned.addField("Reason", ObjectUtil.validString(reason) ? reason : "No reason provided");
        super.postToLog(userBanned, guild.id);
    }
}