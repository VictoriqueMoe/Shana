import {CloseOptionModel} from "../../../../model/DB/entities/autoMod/impl/CloseOption.model";
import type {ArgsOf, Client} from "discordx";
import {Discord, On} from "discordx";
import {CloseableModule} from "../../../../model/closeableModules/impl/CloseableModule";
import {DiscordUtils, ObjectUtil} from "../../../../utils/Utils";
import type {Message} from "discord.js";
import {MessageEmbed, User} from "discord.js";

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
export class AuditLogger extends CloseableModule<null> {

    constructor() {
        super(CloseOptionModel);
    }

    public get moduleId(): string {
        return "userLog";
    }

    @On("guildMemberAdd")
    private async memberJoins([member]: ArgsOf<"guildMemberAdd">, client: Client): Promise<void> {
        if (!await this.isEnabled(member.guild.id)) {
            return;
        }
        const memberJoined = member.id;
        this.postToLog(`<@${memberJoined}> has joined the server`, member.guild.id);
    }

    @On("guildMemberUpdate")
    private async memberDetailsChanged([oldUser, newUser]: ArgsOf<"guildMemberUpdate">, client: Client): Promise<void> {
        const memberUpdate = DiscordUtils.getMemberChanges(oldUser, newUser);
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

    private getTimeoutLeft(timeout: number): number {
        const today = Date.now();
        return Math.abs(today - timeout);
    }


    @On("guildMemberRemove")
    private async memberLeaves([member]: ArgsOf<"guildMemberRemove">, client: Client): Promise<void> {
        const memberLeft = member.id;
        const memberUsername = member.user.username;
        const memeberTag = member.user.tag;
        const guild = member.guild;
        if (!await this.isEnabled(guild.id)) {
            return;
        }
        const banLog = await DiscordUtils.getAuditLogEntry("MEMBER_BAN_ADD", guild);
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

        const kickLog = await DiscordUtils.getAuditLogEntry("MEMBER_KICK", guild);
        if (kickLog) {
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
        this.postToLog(`${memeberTag} has left the server`, member.guild.id);
    }

    @On("guildBanAdd")
    private async memberBanned([ban]: ArgsOf<"guildBanAdd">, client: Client): Promise<void> {
        if (ban.partial) {
            ban = await ban.fetch(true);
        }
        const {guild, reason, user} = ban;
        if (!await this.isEnabled(guild.id)) {
            return;
        }
        const memberBanned = user.id;
        const res = await DiscordUtils.getAuditLogEntry("MEMBER_BAN_ADD", guild);
        let postFix = "";
        if (ObjectUtil.validString(reason)) {
            postFix = `for reason: "${reason}"`;
        }
        if (res) {
            const personWhoDidBan = res.executor;
            this.postToLog(`<@${memberBanned}> (${user.tag}) has been BANNED by ${personWhoDidBan.tag} ${postFix}`, guild.id);
        }
    }

    private postToLog(content: MessageEmbed | string, guildId: string): Promise<Message> {
        return this.canRun(guildId, null, null).then(canRun => {
            if (!canRun) {
                return;
            }
            if (content instanceof MessageEmbed) {
                return DiscordUtils.postToLog([content], guildId);
            }
            return DiscordUtils.postToLog(content, guildId);
        });
    }
}
