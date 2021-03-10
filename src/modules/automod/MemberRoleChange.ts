import {GuildMember, PartialGuildMember} from "discord.js";
import {Roles} from "../../enums/Roles";
import {EnumEx} from "../../utils/Utils";
import RolesEnum = Roles.RolesEnum;

export type RoleChangeType = {
    remove: RolesEnum[],
    add: RolesEnum[]
};

export class MemberRoleChange {

    constructor(private _oldUser: GuildMember | PartialGuildMember, private _newUser: GuildMember | PartialGuildMember) {
    }

    public get roleChanges(): RoleChangeType {
        const oldRoles = this.oldUser.roles.cache.keyArray();
        const newRoles = this.newUser.roles.cache.keyArray();

        const remove: RolesEnum[] = oldRoles.filter(x => !newRoles.includes(x)).map(x => EnumEx.loopBack(RolesEnum, x, true));
        const add: RolesEnum[] = newRoles.filter(x => !oldRoles.includes(x)).map(x => EnumEx.loopBack(RolesEnum, x, true));

        return {
            remove,
            add
        };
    }


    get oldUser(): GuildMember | PartialGuildMember {
        return this._oldUser;
    }

    get newUser(): GuildMember | PartialGuildMember {
        return this._newUser;
    }
}
