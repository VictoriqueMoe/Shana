import {ArgsOf, Client, Discord, On} from "discordx";
import {MessageEmbed, User} from "discord.js";
import {DiscordUtils, ObjectUtil} from "../../../../utils/Utils";
import {Roles} from "../../../../enums/Roles";
import {AbstractAdminAuditLogger} from "./AbstractAdminAuditLogger";


/**
 * admin audit Logger for Admin Audit logging. this will log: <br/>
 * Member join<br/>
 * Member ban<br/>
 * Member kick<br/>
 * Member leave<br/>
 * Member unBanned<br/>
 * Member updated<br/>
 * Member joins/leaves VC<br/>
 */
@Discord()
export class MemberLogger extends AbstractAdminAuditLogger {

    @On("voiceStateUpdate")
    private async voiceChannelChanged([oldState, newState]: ArgsOf<"voiceStateUpdate">, client: Client): Promise<void> {
        const {member} = newState;
        const {user} = member;
        const guildId = member.guild.id;
        const avatarUrl = user.displayAvatarURL({dynamic: true});
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
    private async memberDetailsChanged([oldUser, newUser]: ArgsOf<"guildMemberUpdate">, client: Client): Promise<void> {
        const memberUpdate = DiscordUtils.getMemberChanges(oldUser, newUser);
        if (!ObjectUtil.isValidObject(memberUpdate)) {
            return;
        }
        const {id} = newUser;
        const {user} = newUser;
        const {tag} = user;
        const avatarUrl = user.displayAvatarURL({dynamic: true});
        const embed = new MessageEmbed()
            .setColor('#337FD5')
            .setAuthor(tag, avatarUrl)
            .setThumbnail(avatarUrl)
            .setTimestamp()
            .setFooter(`${user.id}`);
        const {nickName, timeout} = memberUpdate;
        if (ObjectUtil.isValidObject(nickName)) {
            const {before, after} = nickName;
            embed.addFields([
                {
                    "name": "Old nickname",
                    "value": before ?? "None"
                },
                {
                    "name": "New nickname",
                    "value": after ?? "Nickname reset"
                }
            ]);
            embed.setTitle('Member Nickname changed');
        } else if (ObjectUtil.isValidObject(timeout)) {
            const before = Number.isInteger(timeout.before) ? ObjectUtil.timeToHuman(this.getTimeoutLeft(timeout.before)) : "None";
            const after = Number.isInteger(timeout.after) ? ObjectUtil.timeToHuman(this.getTimeoutLeft(timeout.after)) : "None";
            embed.setTitle('Member timeout changed');
            embed.addFields([
                {
                    "name": "Old timeout",
                    "value": before
                },
                {
                    "name": "New timeout",
                    "value": after
                }
            ]);
        }
        const auditEntry = await DiscordUtils.getAuditLogEntry("MEMBER_UPDATE", newUser.guild);
        if (auditEntry) {
            if (auditEntry.target instanceof User && auditEntry.target.id === id) {
                embed.addField("Changed by", auditEntry.executor.tag);
            }
            if (ObjectUtil.validString(auditEntry.reason)) {
                embed.addField("Reason", auditEntry.reason);
            }
        }
        super.postToLog(embed, newUser.guild.id);
    }

    private getTimeoutLeft(timeout: number): number {
        const today = Date.now();
        return Math.abs(today - timeout);
    }

    @On("guildBanRemove")
    private async banRemoved([ban]: ArgsOf<"guildBanRemove">, client: Client): Promise<void> {
        const {guild, reason, user} = ban;
        const memberBannedId = user.id;
        const MemberBannedTag = user.tag;
        const avatarUrl = user.displayAvatarURL({dynamic: true});
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
        const avatarUrl = member.user.displayAvatarURL({dynamic: true});
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
    private async memberLeaves([member]: ArgsOf<"guildMemberRemove">, client: Client): Promise<void> {
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
        const avatarUrl = member.user.displayAvatarURL({dynamic: true});
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
        const avatarUrl = user.displayAvatarURL({dynamic: true});
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