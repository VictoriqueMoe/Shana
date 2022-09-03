import {CloseableModule} from "../../../../../model/closeableModules/impl/CloseableModule.js";
import {AuditLogEvent, EmbedBuilder, Message, User} from "discord.js";
import {ArgsOf, Discord, On} from "discordx";
import {ObjectUtil} from "../../../../../utils/Utils.js";
import {AuditManager} from "../../../../../model/framework/manager/AuditManager.js";
import {GuildInfoChangeManager} from "../../../../../model/framework/manager/GuildInfoChangeManager.js";
import {LogChannelManager} from "../../../../../model/framework/manager/LogChannelManager.js";
import {ModAuditLogSettings} from "../../../../../model/closeableModules/settings/ModAuditLogSettings.js";
import {injectable} from "tsyringe";

/**
 * Non admin audit Logger for quick logs. this will log:<br/>
 * Member join<br/>
 * Member ban<br/>
 * Member kick<br/>
 * Member leave<br/>
 * Member muted<br/>
 * Member un-muted<br/>
 */
@Discord()
@injectable()
export class AuditLogger extends CloseableModule<ModAuditLogSettings> {

    public constructor(private _auditManager: AuditManager,
                       private _guildInfoChangeManager: GuildInfoChangeManager,
                       private _logManager: LogChannelManager) {
        super();
    }

    public override get moduleId(): string {
        return "userLog";
    }

    public async isEnabledInternal(guildId: string, logger: keyof ModAuditLogSettings): Promise<boolean> {
        const moduleEnabled = await super.isEnabled(guildId);
        if (!moduleEnabled) {
            return false;
        }
        const settings = await this.getSettings(guildId, false);
        return settings[logger] ?? false;
    }

    public setDefaults(guildId: string): Promise<void> {
        return super.saveSettings(guildId, {
            memberBanned: false,
            memberJoined: false,
            memberKicked: false,
            memberLeaves: false,
            memberMuted: false
        }, false, true);
    }

    @On({
        event: "guildMemberAdd"
    })
    private async memberJoins([member]: ArgsOf<"guildMemberAdd">): Promise<void> {
        const enabled = await this.isEnabledInternal(member.guild.id, "memberJoined");
        if (!enabled) {
            return;
        }
        if (!await this.isEnabled(member.guild.id)) {
            return;
        }
        const memberJoined = member.id;
        this.postToLog(`<@${memberJoined}> has joined the server`, member.guild.id);
    }

    private getTimeoutLeft(timeout: number): number {
        const today = Date.now();
        return Math.abs(today - timeout);
    }

    @On({
        event: "guildMemberUpdate"
    })
    private async memberDetailsChanged([oldUser, newUser]: ArgsOf<"guildMemberUpdate">): Promise<void> {
        const enabled = await this.isEnabledInternal(newUser.guild.id, "memberMuted");
        if (!enabled) {
            return;
        }
        const memberUpdate = this._guildInfoChangeManager.getMemberChanges(oldUser, newUser);
        if (!ObjectUtil.isValidObject(memberUpdate)) {
            return;
        }
        const {timeout} = memberUpdate;
        if (ObjectUtil.isValidObject(timeout)) {
            if (timeout.after === null) {
                this.postToLog(`${newUser.user.tag} has been un-muted`, newUser.guild.id);
            } else if (Number.isInteger(timeout.after)) {
                const after = ObjectUtil.timeToHuman(this.getTimeoutLeft(timeout.after));
                this.postToLog(`${newUser.user.tag} has been muted for ${after}`, newUser.guild.id);
            }
        }
    }

    @On({
        event: "guildMemberRemove"
    })
    private async memberLeaves([member]: ArgsOf<"guildMemberRemove">): Promise<void> {
        const memberLeft = member.id;
        const memberUsername = member.user.username;
        const memeberTag = member.user.tag;
        const guild = member.guild;
        if (!await this.isEnabled(guild.id)) {
            return;
        }
        const banLog = await this._auditManager.getAuditLogEntry(AuditLogEvent.MemberBanAdd, guild);
        if (banLog) {
            const target = banLog.target;
            if (target instanceof User) {
                if (target.id === memberLeft) {
                    if (banLog.createdAt >= member.joinedAt) {
                        return;
                    }
                }
            }
        }

        const kickLog = await this._auditManager.getAuditLogEntry(AuditLogEvent.MemberKick, guild);
        if (kickLog) {
            const enabled = await this.isEnabledInternal(guild.id, "memberKicked");
            if (!enabled) {
                return;
            }
            const target = kickLog.target;
            if (target instanceof User) {
                if (target.id === memberLeft) {
                    if (kickLog.createdAt >= member.joinedAt) {
                        const personWhoDidKick = kickLog.executor;
                        const reason = kickLog.reason;
                        let prefix = "";
                        if (ObjectUtil.validString(reason)) {
                            prefix = `for reason: "${reason}"`;
                        }
                        this.postToLog(`"${memberUsername}" has been kicked by ${personWhoDidKick.username} ${prefix}`, member.guild.id);
                        return;
                    }
                }
            }
        }
        const enabled = await this.isEnabledInternal(guild.id, "memberLeaves");
        if (!enabled) {
            return;
        }
        this.postToLog(`${memeberTag} has left the server`, guild.id);
    }

    private postToLog(content: EmbedBuilder | string, guildId: string): Promise<Message> {
        if (content instanceof EmbedBuilder) {
            return this._logManager.postToLog([content], guildId);
        }
        return this._logManager.postToLog(content, guildId);
    }

    @On({
        event: "guildBanAdd"
    })
    private async memberBanned([ban]: ArgsOf<"guildBanAdd">): Promise<void> {
        const enabled = await this.isEnabledInternal(ban.guild.id, "memberBanned");
        if (!enabled) {
            return;
        }

        if (ban.partial) {
            ban = await ban.fetch(true);
        }
        const {guild, reason, user} = ban;
        if (!await this.isEnabled(guild.id)) {
            return;
        }
        const memberBanned = user.id;
        const res = await this._auditManager.getAuditLogEntry(AuditLogEvent.MemberBanAdd, guild);
        let postFix = "";
        if (ObjectUtil.validString(reason)) {
            postFix = `for reason: "${reason}"`;
        }
        if (res) {
            const personWhoDidBan = res.executor;
            this.postToLog(`<@${memberBanned}> (${user.tag}) has been BANNED by ${personWhoDidBan.tag} ${postFix}`, guild.id);
        }
    }
}
