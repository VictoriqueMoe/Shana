import {GuildUtils} from "../utils/Utils";
import {Roles} from "../enums/Roles";
import {GuildMember} from "discord.js";
import RolesEnum = Roles.RolesEnum;
import {GuardFunction} from "@typeit/discord";

export const excludeGuard: GuardFunction<"message"> = async (
    [message],
    client,
    next
) => {
    const member: GuildMember = await message.member.fetch();
    if (GuildUtils.isMemberAdmin(member)) {
        return;
    }
    const memberRoles = member.roles.cache;
    // this is where we go to the DB to find who is immune
    const hardCodedImmunes = [RolesEnum.OVERWATCH_ELITE, RolesEnum.CIVIL_PROTECTION, RolesEnum.ZOMBIES];
    for (const immuneRoles of hardCodedImmunes) {
        if (memberRoles.has(immuneRoles)) {
            return;
        }
    }
    await next();
};