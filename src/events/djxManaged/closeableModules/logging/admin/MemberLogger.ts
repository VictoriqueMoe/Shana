import {ArgsOf, Discord, On} from "discordx";
import {AbstractAdminAuditLogger} from "./AbstractAdminAuditLogger";
import {AuditLogEvent, EmbedBuilder, User} from "discord.js";
import {DiscordUtils, ObjectUtil} from "../../../../../utils/Utils.js";


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
    private async voiceChannelChanged([oldState, newState]: ArgsOf<"voiceStateUpdate">): Promise<void> {
        const {member} = newState;
        const {user} = member;
        const guildId = member.guild.id;
        const avatarUrl = user.displayAvatarURL();
        const oldChannel = oldState.channelId;
        const newChannel = newState.channelId;
        const wasDisconnect = ObjectUtil.validString(oldChannel) && newChannel == null;
        const wasConnect = ObjectUtil.validString(newChannel) && oldChannel == null;
        const wasServerSwap = (oldChannel !== null && newChannel !== null) && newChannel !== oldChannel;
        const displayHexColor = member.displayHexColor;
        const embed = new EmbedBuilder()
            .setColor(displayHexColor)
            .setAuthor({
                name: member.user.tag,
                iconURL: avatarUrl
            })
            .setThumbnail(avatarUrl)
            .setTimestamp()
            .setFooter({
                text: `${user.id}`
            });
        if (wasServerSwap) {
            embed.setTitle("User changed voice channels");
            embed.setDescription(`<@${user.id}> has changed voice channels`);
            embed.addFields(ObjectUtil.singleFieldBuilder("From", `<#${oldChannel}>`));
            embed.addFields(ObjectUtil.singleFieldBuilder("To", `<#${newChannel}>`));
        } else if (wasDisconnect) {
            embed.setTitle("User disconnected from a voice channel");
            embed.setDescription(`<@${user.id}> has disconnected from a voice channel`);
            embed.addFields(ObjectUtil.singleFieldBuilder("From", `<#${oldChannel}>`));
        } else if (wasConnect) {
            embed.setTitle("User connected to a voice channel");
            embed.setDescription(`<@${user.id}> has connected to a voice channel`);
            embed.addFields(ObjectUtil.singleFieldBuilder("To", `<#${newChannel}>`));
        } else {
            return;
        }
        super.postToLog(embed, guildId);
    }

    @On("guildMemberUpdate")
    private async memberDetailsChanged([oldUser, newUser]: ArgsOf<"guildMemberUpdate">): Promise<void> {
        const memberUpdate = this._guildInfoChangeManager.getMemberChanges(oldUser, newUser);
        if (!ObjectUtil.isValidObject(memberUpdate)) {
            return;
        }
        const {id} = newUser;
        const {user} = newUser;
        const {tag} = user;
        const avatarUrl = user.displayAvatarURL();
        const embed = new EmbedBuilder()
            .setColor('#337FD5')
            .setAuthor({
                name: tag,
                iconURL: avatarUrl
            })
            .setThumbnail(avatarUrl)
            .setTimestamp()
            .setFooter({
                text: `${user.id}`
            });
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
        const auditEntry = await this._auditManager.getAuditLogEntry(AuditLogEvent.MemberUpdate, newUser.guild);
        if (auditEntry) {
            if (auditEntry.target instanceof User && auditEntry.target.id === id) {
                embed.addFields(ObjectUtil.singleFieldBuilder("Changed by", auditEntry.executor.tag));
            }
            if (ObjectUtil.validString(auditEntry.reason)) {
                embed.addFields(ObjectUtil.singleFieldBuilder("Reason", auditEntry.reason));
            }
        }
        super.postToLog(embed, newUser.guild.id);
    }

    private getTimeoutLeft(timeout: number): number {
        const today = Date.now();
        return Math.abs(today - timeout);
    }

    @On("guildBanRemove")
    private async banRemoved([ban]: ArgsOf<"guildBanRemove">): Promise<void> {
        const {guild, user} = ban;
        const memberBannedId = user.id;
        const MemberBannedTag = user.tag;
        const avatarUrl = user.displayAvatarURL();
        const auditEntry = await this._auditManager.getAuditLogEntry(AuditLogEvent.MemberBanRemove, guild);
        const embed = new EmbedBuilder()
            .setColor('#337FD5')
            .setTitle('Member Unbanned')
            .setAuthor({
                name: `Member Unbanned`,
                iconURL: avatarUrl
            })
            .setDescription(`<@${memberBannedId}> ${MemberBannedTag}`)
            .setThumbnail(avatarUrl)
            .setTimestamp()
            .setFooter({
                text: `${user.id}`
            });
        if (auditEntry && auditEntry.target instanceof User && auditEntry.target.id === memberBannedId) {
            embed.addFields(ObjectUtil.singleFieldBuilder("ban Removed By", auditEntry.executor.tag));
        }
        super.postToLog(embed, guild.id);
    }

    @On("guildMemberAdd")
    private async memberJoins([member]: ArgsOf<"guildMemberAdd">): Promise<void> {
        const memberJoinedId = member.id;
        const memberJoinedTag = member.user.tag;
        const avatarUrl = member.user.displayAvatarURL();
        const userJoinEmbed = new EmbedBuilder()
            .setColor('#43B581')
            .setTitle('Member Joined')
            .setAuthor({
                name: `Member Joined`,
                iconURL: avatarUrl
            })
            .setDescription(`<@${memberJoinedId}> ${memberJoinedTag}`)
            .setThumbnail(avatarUrl)
            .addFields({
                name: 'Account Age',
                value: DiscordUtils.getAccountAge(member, true) as string
            })
            .setTimestamp()
            .setFooter({
                text: `${member.id}`
            });
        super.postToLog(userJoinEmbed, member.guild.id);
    }

    @On("guildMemberRemove")
    private async memberLeaves([member]: ArgsOf<"guildMemberRemove">): Promise<void> {
        const guild = member.guild;
        const banLog = await this._auditManager.getAuditLogEntry(AuditLogEvent.MemberBanAdd, guild);
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
        const avatarUrl = member.user.displayAvatarURL();
        const roles = member.roles.cache;
        const kickLog = await this._auditManager.getAuditLogEntry(AuditLogEvent.MemberKick, guild);
        let userJoinEmbed: EmbedBuilder = null;
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
        const rolesArr = roles.filter(r => r.id !== guild.roles.everyone.id).map(role => `<@&${role.id}>`);
        if (wasKicked) {
            userJoinEmbed = new EmbedBuilder()
                .setColor('#FF470F')
                .setTitle('Member Was Kicked')
                .setAuthor({
                    name: `Member Kicked`,
                    iconURL: avatarUrl
                })
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
                .setFooter({
                    text: `${member.id}`
                });
        } else {
            userJoinEmbed = new EmbedBuilder()
                .setColor('#FF470F')
                .setTitle('Member Left')
                .setAuthor({
                    name: `Member Left`,
                    iconURL: avatarUrl
                })
                .setDescription(`<@${memberJoinedId}> ${memberJoinedTag}`)
                .setThumbnail(avatarUrl)
                .setTimestamp()
                .setFooter({
                    text: `${member.id}`
                });
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
    private async memberBanned([ban]: ArgsOf<"guildBanAdd">): Promise<void> {
        if (ban.partial) {
            ban = await ban.fetch(true);
        }
        const {guild, reason, user} = ban;
        const avatarUrl = user.displayAvatarURL();
        const userBanned = new EmbedBuilder()
            .setColor('#FF470F')
            .setTitle('Member banned')
            .setAuthor({
                name: `Member banned`,
                iconURL: avatarUrl
            })
            .setDescription(`<@${user.id}> ${user.tag}`)
            .setThumbnail(avatarUrl)
            .setTimestamp()
            .setFooter({
                text: `${user.id}`
            });
        const res = await this._auditManager.getAuditLogEntry(AuditLogEvent.MemberBanAdd, guild);
        if (res) {
            const target = res.target;
            if (target instanceof User) {
                if (user.id === target.id) {
                    userBanned.addFields(ObjectUtil.singleFieldBuilder("Banned by", res.executor.tag));
                }
            }
        }
        userBanned.addFields(ObjectUtil.singleFieldBuilder("Reason", ObjectUtil.validString(reason) ? reason : "No reason provided"));
        super.postToLog(userBanned, guild.id);
    }
}
