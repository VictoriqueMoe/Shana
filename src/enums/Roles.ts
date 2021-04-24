import {GuildMember} from "discord.js";

export namespace Roles {
    export enum RolesEnum {
        "OWNER" = "595455886420475926",
        "ADVISOR" = "767409384723709972",
        "WEEB_OVERLORD" = "765298257915936798",
        "OVERWATCH_ELITE" = "610568780699140172",
        "CIVIL_PROTECTION" = "264431066767425546",
        "ZOMBIES" = "343035318032662549",
        "HEADCRABS" = "264431811570958337",
        "EVERYONE" = "264429768219426819"
    }

    export function isMemberStaff(member: GuildMember): boolean {
        const highestRole = member.roles.highest;
        const id = highestRole.id;
        return id === RolesEnum.CIVIL_PROTECTION ||
            id === RolesEnum.OVERWATCH_ELITE ||
            id === RolesEnum.WEEB_OVERLORD ||
            id === RolesEnum.ADVISOR ||
            id === RolesEnum.OWNER;

    }
}
