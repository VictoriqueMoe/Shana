import {Roles} from "../enums/Roles";
import {GuildUtils} from "../utils/Utils";
import RolesEnum = Roles.RolesEnum;

export const roleConstraints = (...roles: RolesEnum[]) => async ([message], client, next) => {
    const member = await message.member.fetch();
    const memberRoles = member.roles.cache;
    if (GuildUtils.isMemberAdmin(message.member)) {
        await next();
        return;
    }
    for (const [, role] of memberRoles) {
        const id = role.id;
        if (roles.includes(id as RolesEnum)) {
            await next();
            return;
        }
    }
    message.reply("you do not have permissions to use this command");
};