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
export class AuditLogger extends CloseableModule {

    private static _uid = ObjectUtil.guid();

    constructor() {
        super(CloseOptionModel, AuditLogger._uid);
    }

    @On("guildMemberAdd")
    @Guard(EnabledGuard("userLog"))
    private async memberJoins([member]: ArgsOf<"guildMemberAdd">, client: Client): Promise<void> {
        const memberJoined = member.id;
        DiscordUtils.postToLog(`<@${memberJoined}> has joined the server`);
    }

    @On("guildMemberRemove")
    @Guard(EnabledGuard("userLog"))
    private async memberLeaves([member]: ArgsOf<"guildMemberAdd">, client: Client): Promise<void> {
        const memberLeft = member.id;
        const memberUsername = member.user.username;
        const guild = member.guild;
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
                        const personWhoDidKick = banLog.executor;
                        const reason = banLog.reason;
                        DiscordUtils.postToLog(`"${memberUsername}" has been kicked by ${personWhoDidKick.username} for reason: "${reason}"`);
                        return;
                    }
                }
            }
        }
        DiscordUtils.postToLog(`"${memberUsername}" has left the server`);
    }

    @On("guildBanAdd")
    @Guard(EnabledGuard("userLog"))
    private async memberBanned([guild, user]: ArgsOf<"guildBanAdd">, client: Client): Promise<void> {
        const memberBanned = user.id;
        const res = await DiscordUtils.getAuditLogEntry("MEMBER_BAN_ADD", guild);
        if (res) {
            const personWhoDidBan = res.executor;
            const reason = res.reason;
            DiscordUtils.postToLog(`<@${memberBanned}> has been BANNED by ${personWhoDidBan.username} for reason: "${reason}"`);
        }
    }


    public get moduleId(): string {
        return "userLog";
    }

    public get isDynoReplacement(): boolean {
        return true;
    }

    get isEnabled(): boolean {
        return false;
    }
}