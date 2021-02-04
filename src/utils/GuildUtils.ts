import {GuildMember, Permissions} from "discord.js";

const {GuildID} = require('../../config.json');

export module GuildUtils {
    export function getGuildID(): string {
        return GuildID as string;
    }

    export function isMemberAdmin(member:GuildMember):boolean{
        let memberRoles = member.roles.cache;
        for (let [, role] of memberRoles) {
            let perms = role.permissions;
            let isAdmin = perms.has(Permissions.FLAGS.ADMINISTRATOR, true);
            if(isAdmin){
                return true;
            }
        }
        return false;
    }
}