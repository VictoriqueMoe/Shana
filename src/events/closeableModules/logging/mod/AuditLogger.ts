import {CloseOptionModel} from "../../../../model/DB/autoMod/impl/CloseOption.model";
import {ArgsOf, Client, Guard, On} from "@typeit/discord";
import {EnabledGuard} from "../../../../guards/EnabledGuard";
import {CloseableModule} from "../../../../model/closeableModules/impl/CloseableModule";
import {DiscordUtils, ObjectUtil} from "../../../../utils/Utils";
import {User} from "discord.js";

/**
 * Non admin audit Logger for quick logs. this will log:
 * Member join
 * Member ban
 * Member kick
 * Member leave
 */
export class AuditLogger extends CloseableModule<null> {

    private static _uid = ObjectUtil.guid();

    constructor() {
        super(CloseOptionModel, AuditLogger._uid);
    }

    @On("guildMemberAdd")
    @Guard(EnabledGuard("userLog"))
    private async memberJoins([member]: ArgsOf<"guildMemberAdd">, client: Client): Promise<void> {
        if (!await this.isEnabled(member.guild.id)) {
            return;
        }
        const memberJoined = member.id;
        DiscordUtils.postToLog(`<@${memberJoined}> has joined the server`, member.guild.id);
    }

    @On("guildMemberRemove")
    @Guard(EnabledGuard("userLog"))
    private async memberLeaves([member]: ArgsOf<"guildMemberAdd">, client: Client): Promise<void> {
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
                        DiscordUtils.postToLog(`"${memberUsername}" has been kicked by ${personWhoDidKick.username} ${prefix}`, member.guild.id);
                        return;
                    }
                }
            }
        }
        DiscordUtils.postToLog(`${memeberTag} has left the server`, member.guild.id);
    }

    @On("guildBanAdd")
    @Guard(EnabledGuard("userLog"))
    private async memberBanned([guild, user]: ArgsOf<"guildBanAdd">, client: Client): Promise<void> {
        if (!await this.isEnabled(guild.id)) {
            return;
        }
        const memberBanned = user.id;
        const res = await DiscordUtils.getAuditLogEntry("MEMBER_BAN_ADD", guild);
        if (res) {
            const personWhoDidBan = res.executor;
            const reason = res.reason;
            let prefix = "";
            if (ObjectUtil.validString(reason)) {
                prefix = `for reason: "${reason}"`;
            }
            DiscordUtils.postToLog(`<@${memberBanned}> (${user.tag}) has been BANNED by ${personWhoDidBan.tag} ${prefix}"`, guild.id);
        }
    }


    public get moduleId(): string {
        return "userLog";
    }

    public get isDynoReplacement(): boolean {
        return true;
    }
}