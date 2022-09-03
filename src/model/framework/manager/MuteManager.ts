import {GuildMember} from "discord.js";
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

    public muteUser(user: GuildMember, reason: string, length: TIME_OUT): Promise<GuildMember> {
        return user.timeout(length, reason);
    }

    public async getAllMutedMembers(guildId: string): Promise<GuildMember[]> {
        const guild = await DiscordUtils.getGuild(guildId);
        const memberManager = guild.members;
        return [...memberManager.cache.filter(this.isMuted).values()];
    }
}
