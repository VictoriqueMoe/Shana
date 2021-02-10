import {Role} from "discord.js";
import {Main} from "../Main";
import {GuildUtils} from "../utils/Utils";

export module Roles {
    export enum RolesEnum {
        "ADVISOR" = "767409384723709972",
        "WEEB_OVERLORD" = "765298257915936798",
        "OVERWATCH_ELITE" = "610568780699140172",
        "CIVIL_PROTECTION" = "264431066767425546",
        "OUR_BENEFACTORS" = "629353729984036869",
        "ZOMBIES" = "343035318032662549",
        "HEADCRABS" = "264431811570958337",
        "SPECIAL" = "264436175501000704",
        "EVERYONE" = "264429768219426819"
    }

    export function getRole(role: RolesEnum): Promise<Role> {
        let client = Main.client;
        let guild = client.guilds.cache.get(GuildUtils.getGuildID());
        let roles = guild.roles;
        return roles.fetch(role);
    }
}
