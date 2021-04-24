import {GuildMember, PartialGuildMember} from "discord.js";
import {Roles} from "../../enums/Roles";

export type RoleChangeType = {
    remove: string[],
    add: string[]
};

export class MemberRoleChange {

    constructor(private _oldUser: GuildMember | PartialGuildMember, private _newUser: GuildMember | PartialGuildMember) {
    }

    public get roleChanges(): RoleChangeType {
        const oldRoles = this.oldUser.roles.cache.keyArray();
        const newRoles = this.newUser.roles.cache.keyArray();

        const remove: string[] = oldRoles.filter(x => !newRoles.includes(x));
        const add: string[] = newRoles.filter(x => !oldRoles.includes(x));

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
