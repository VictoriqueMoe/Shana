import {GuildMember, PartialGuildMember, User} from "discord.js";
import {Roles} from "../../enums/Roles";
import RolesEnum = Roles.RolesEnum;
import {EnumEx} from "../../utils/Utils";

export type RoleChangeType = {
    remove: RolesEnum[],
    add: RolesEnum[]
};

export class UserChange {

    constructor(private _oldUser: GuildMember | PartialGuildMember, private _newUser: GuildMember | PartialGuildMember) {
    }

    public get roleChanges(): RoleChangeType {
        let oldRoles = this.oldUser.roles.cache.keyArray();
        let newRoles = this.newUser.roles.cache.keyArray();

        let remove: RolesEnum[] = oldRoles.filter(x => !newRoles.includes(x)).map(x => EnumEx.loopBack(RolesEnum, x, true));
        let add: RolesEnum[] = newRoles.filter(x => !oldRoles.includes(x)).map(x => EnumEx.loopBack(RolesEnum, x, true));

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
