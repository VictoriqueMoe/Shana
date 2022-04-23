import type {GuildAuditLogsEntry, GuildMember} from "discord.js";
import {User} from "discord.js";
import type {TimeUtils} from "../../../utils/Utils";
import {DiscordUtils} from "../../../utils/Utils";
import {singleton} from "tsyringe";
import type {GuildManager} from "./GuildManager";


@singleton()
export class MuteManager {

    public constructor(private _guildManager: GuildManager) {
    }

    public isMuted(user: GuildMember): boolean {
        return user.isCommunicationDisabled();
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
        const auditEntries = await DiscordUtils.getAuditLogEntries("MEMBER_UPDATE", guild, null);
        const filteredEntries = [...auditEntries.entries.filter(entry =>
            entry.actionType === "UPDATE" && entry.target instanceof User && entry.target.id === user.id
        ).values()];
        for (const entry of filteredEntries) {
            console.log(entry);
        }
        return null;
    }
}
