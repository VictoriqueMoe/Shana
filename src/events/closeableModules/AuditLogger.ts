import {CloseOptionModel} from "../../model/DB/autoMod/impl/CloseOption.model";
import {ArgsOf, Client, Guard, On} from "@typeit/discord";
import {EnabledGuard} from "../../guards/EnabledGuard";
import {CloseableModule} from "../../model/closeableModules/impl/CloseableModule";
import {DiscordUtils} from "../../utils/Utils";
import {User} from "discord.js";

/**
 * Non admin audit Logger for quick logs. this will log:
 * Member join
 * Member ban
 * Member kick
 * Member leave
 */
export class AuditLogger extends CloseableModule {
    constructor() {
        super(CloseOptionModel);
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
        const banLogs = await member.guild.fetchAuditLogs({
            limit: 1,
            type: 'MEMBER_BAN_ADD',
        });
        const banLog = banLogs.entries.first();
        if (banLog) {
            const target = banLog.target;
            if (target instanceof User) {
                if (target.id === memberLeft) {
                    return;
                }
            }
        }

        const kickLogs = await member.guild.fetchAuditLogs({
            limit: 1,
            type: 'MEMBER_KICK',
        });
        const kickLog = kickLogs.entries.first();
        if (kickLog) {
            const target = kickLog.target;
            if (target instanceof User) {
                if (target.id === memberLeft) {
                    const personWhoDidKick = banLog.executor;
                    const reason = banLog.reason;
                    DiscordUtils.postToLog(`"${memberUsername}" has been kicked by ${personWhoDidKick.username} for reason: "${reason}"`);
                    return;
                }
            }
        }
        DiscordUtils.postToLog(`"${memberUsername}" has left the server`);
    }

    @On("guildBanAdd")
    @Guard(EnabledGuard("userLog"))
    private async memberBanned([guild, user]: ArgsOf<"guildBanAdd">, client: Client): Promise<void> {
        const memberBanned = user.id;
        const fetchedLogs = await guild.fetchAuditLogs({
            limit: 1,
            type: 'MEMBER_BAN_ADD',
        });
        const banLog = fetchedLogs.entries.first();
        if (banLog) {
            const personWhoDidBan = banLog.executor;
            const reason = banLog.reason;
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