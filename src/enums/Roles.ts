import {GuildMember, Role} from "discord.js";
import {Main} from "../Main";
import {GuildUtils} from "../utils/Utils";

export namespace Roles {
    export enum RolesEnum {
        "OWNER" = "595455886420475926",
        "ADVISOR" = "767409384723709972",
        "WEEB_OVERLORD" = "765298257915936798",
        "VIC_BOT" = "809098050651291748",
        "OVERWATCH_ELITE" = "610568780699140172",
        "CIVIL_PROTECTION" = "264431066767425546",
        "OUR_BENEFACTORS" = "629353729984036869",
        "ZOMBIES" = "343035318032662549",
        "HEADCRABS" = "264431811570958337",
        "SPECIAL" = "264436175501000704",
        "MUTED" = "660752330177773588",
        "EVERYONE" = "264429768219426819"
    }

    export function getRole(role: RolesEnum): Promise<Role> {
        const client = Main.client;
        const guild = client.guilds.cache.get(GuildUtils.getGuildID());
        const roles = guild.roles;
        return roles.fetch(role);
    }

    export function isMemberStaff(member: GuildMember): boolean {
        const highestRole = member.roles.highest;
        const id = highestRole.id;
        return id === RolesEnum.CIVIL_PROTECTION ||
            id === RolesEnum.OVERWATCH_ELITE ||
            id === RolesEnum.WEEB_OVERLORD ||
            id === RolesEnum.ADVISOR ||
            id === RolesEnum.OWNER

    }
}
