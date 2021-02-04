import {GuardFunction} from "@typeit/discord";
import {Roles} from "../enums/Roles";
import RolesEnum = Roles.RolesEnum;
import {Permissions} from "discord.js";

export function RoleConstraints(...roles: RolesEnum[]) {
    const guard: GuardFunction<"message"> = async (
        [message],
        client,
        next
    ) => {
        let memberRoles = message.member.roles.cache;
        for(let role of roles){
            let roleObject = await Roles.getRole(role);
            let perms = roleObject.permissions;
            let isAdmin = perms.has(Permissions.FLAGS.ADMINISTRATOR, true);
            if(isAdmin){
                await next();
                return;
            }
            if(memberRoles.has(roleObject.id)){
                await next();
                break;
            }
        }
    };

    return guard;
}