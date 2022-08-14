import {singleton} from "tsyringe";
import {
    Guild,
    GuildAuditLogs,
    GuildAuditLogsEntry,
    GuildAuditLogsFetchOptions,
    GuildAuditLogsResolvable
} from "discord.js";
import {AuditLogEvent} from "discord-api-types/v10";

@singleton()
export class AuditManager {

    public async getAuditLogEntry(type: GuildAuditLogsResolvable, guild: Guild): Promise<GuildAuditLogsEntry<AuditLogEvent>> {
        const fetchedAuditLog = await this.getAuditLogEntries(type, guild);
        if (!fetchedAuditLog) {
            return null;
        }
        const logEntry = fetchedAuditLog.entries.first();
        if (!logEntry) {
            return null;
        }
        return logEntry;
    }

    /**
     * Get all entries from the audit log with optinal limit
     * @param type
     * @param guild
     * @param limit
     */
    public getAuditLogEntries(type: GuildAuditLogsResolvable, guild: Guild, limit = 1): Promise<GuildAuditLogs<AuditLogEvent>> {
        const fetchObj: GuildAuditLogsFetchOptions<AuditLogEvent> = {
            limit,
            type
        };
        try {
            return guild.fetchAuditLogs(fetchObj);
        } catch {
            return null;
        }
    }
}
