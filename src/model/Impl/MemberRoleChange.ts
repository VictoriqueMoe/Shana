import type {GuildMember, PartialGuildMember} from "discord.js";

export type RoleChangeType = {
    remove: string[],
    add: string[]
};

export class MemberRoleChange {

    constructor(private _oldUser: GuildMember | PartialGuildMember, private _newUser: GuildMember | PartialGuildMember) {
    }

    public get roleChanges(): RoleChangeType {
        const oldRoles = [...this.oldUser.roles.cache.keys()];
        const newRoles = [...this.newUser.roles.cache.keys()];

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
