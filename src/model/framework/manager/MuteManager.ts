import {GuildAuditLogsEntry, GuildMember} from "discord.js";
import {singleton} from "tsyringe";
import {AuditManager} from "./AuditManager.js";
import TIME_OUT from "../../../enums/TIME_OUT.js";
import {DiscordUtils} from "../../../utils/Utils.js";


@singleton()
export class MuteManager {

    public constructor(private _auditManager: AuditManager) {
    }

    public isMuted(user: GuildMember): boolean {
        return user.isCommunicationDisabled();
    }

    public async muteUser(user: GuildMember, reason: string, length: TIME_OUT): Promise<GuildMember> {
        return user.timeout(length, reason);
    }

    public async getAllMutedMembers(guildId: string): Promise<GuildMember[]> {
        const guild = await DiscordUtils.getGuild(guildId);
        const memberManager = guild.members;
        return [...memberManager.cache.filter(this.isMuted).values()];
    }


    public async getAudit(/* user: GuildMember */): Promise<GuildAuditLogsEntry> {
        /* const guild = await DiscordUtils.getGuild(user.guild.id);
        const auditEntries = await this._auditManager.getAuditLogEntries(AuditLogEvent.MemberUpdate, guild, null);
        const filteredEntries = [...auditEntries.entries.filter(entry =>
            entry.actionType === "UPDATE" && entry.target instanceof User && entry.target.id === user.id
        ).values()];
        for (const entry of filteredEntries) {
            console.log(entry);
        } */
        return null;
    }
}
