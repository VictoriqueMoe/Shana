import {GuildAuditLogsEntry, GuildMember, User} from "discord.js";
import {DiscordUtils, TimeUtils} from "../../../utils/Utils";
import {singleton} from "tsyringe";
import {GuildManager} from "./GuildManager";


@singleton()
export class MuteManager {

    public constructor(private _guildManager: GuildManager) {
    }

    public isMuted(user: GuildMember): boolean {
        return Number.isInteger(user.communicationDisabledUntilTimestamp);
    }

    public async muteUser(user: GuildMember, reason: string, length: TimeUtils.TIME_OUT): Promise<GuildMember> {
        return user.timeout(length, reason);
    }

    public async getAllMutedMembers(guildId: string): Promise<GuildMember[]> {
        const guild = await this._guildManager.getGuild(guildId);
        const memberManager = guild.members;
        return [...memberManager.cache.filter(member => this.isMuted(member)).values()];
    }


    public async getAudit(user: GuildMember): Promise<GuildAuditLogsEntry> {
        const guild = await this._guildManager.getGuild(user.guild.id);
        const auditEntries = await DiscordUtils.getAuditLogEntries("MEMBER_UPDATE", guild, -1);
        const filteredEntries = [...auditEntries.entries.filter(entry =>
            entry.actionType === "UPDATE" && entry.target instanceof User && entry.target.id === user.id
        ).values()];
        for (const entry of filteredEntries) {
            console.log(entry);
        }
        return null;
    }
}