import {GuildUtils} from "../utils/Utils";
import {Roles} from "../enums/Roles";
import {GuildMember, TextChannel} from "discord.js";
import {GuardFunction} from "@typeit/discord";
import {Main} from "../Main";
import RolesEnum = Roles.RolesEnum;

export const excludeGuard: GuardFunction<"message"> = async (
    [message],
    client,
    next
) => {
    if(!message.member){
        return;
    }
    const member: GuildMember = await message.member.fetch();
    if (Main.testMode) {
        return await next();
    }
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
    const channel = message.channel;
    if (!(channel instanceof TextChannel)) {
        return;
    }
    // channel also hard coded too!
    const parent = channel.parent;
    if(parent.id === "360789754846904320"){
        return;
    }
    await next();
};