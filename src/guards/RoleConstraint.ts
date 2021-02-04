import {Roles} from "../enums/Roles";
import {GuildUtils} from "../utils/GuildUtils";
import RolesEnum = Roles.RolesEnum;

export const roleConstraints = (...roles: RolesEnum[]) => async ([message], client, next) => {
    let memberRoles = message.member.roles.cache;
    if(GuildUtils.isMemberAdmin(message.member)){
        await next();
        return;
    }
    for (let [, role] of memberRoles) {
        let id = role.id;
        if (roles.includes(id as RolesEnum)) {
            await next();
            return;
        }
    }
};