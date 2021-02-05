import {GuildChannel, GuildChannelManager, GuildMember, Permissions} from "discord.js";
import cronstrue from 'cronstrue';
import {isValidCron} from 'cron-validator';
import {Main} from "../Main";

const {GuildID} = require('../../config.json');

export class ChronException extends Error {
    constructor(e: string) {
        super(e);

        Object.setPrototypeOf(this, ChronException.prototype);
    }
}

export module GuildUtils {
    export function getGuildID(): string {
        return GuildID as string;
    }

    export function isMemberAdmin(member: GuildMember): boolean {
        let memberRoles = member.roles.cache;
        for (let [, role] of memberRoles) {
            let perms = role.permissions;
            let isAdmin = perms.has(Permissions.FLAGS.ADMINISTRATOR, true);
            if (isAdmin) {
                return true;
            }
        }
        return false;
    }
}

export module StringUtils {
    export function splitCommandLine(commandLine): string[] {
        let spaceMarker = '<SP>';
        while (commandLine.indexOf(spaceMarker) > -1) spaceMarker += '@';
        let noSpacesInQuotes = commandLine.replace(/"([^"]*)"?/g, (fullMatch, capture) => capture.replace(/ /g, spaceMarker));
        let mangledParamArray = noSpacesInQuotes.split(/ +/);
        let paramArray = mangledParamArray.map((mangledParam) => mangledParam.replace(RegExp(spaceMarker, 'g'), ' '));
        paramArray.shift();
        return paramArray;
    }
}

export module ChronUtils {
    export function chronToString(chron: string): string {
        if (!isValidCron(chron, {seconds: true})) {
            throw new ChronException("Chron is not valid");
        }
        return cronstrue.toString(chron);
    }
}

export module DiscordUtils {
    export function findChannelById(channelName: string): GuildChannel {
        let channels = Main.client.guilds.cache.get(GuildUtils.getGuildID()).channels;
        for (let [, channel] of channels.cache) {
            if (channel.name === channelName) {
                return channel;
            }
        }
        return null;
    }
}

export class ObjectUtil {
    public static guid(): string {
        function s4(): string {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    public static validString(...strings: Array<unknown>): boolean {
        if (strings.length === 0) {
            return false;
        }
        for (let currString of strings) {
            if (typeof currString !== "string") {
                return false;
            }
            if (currString.length === 0) {
                return false;
            }
            if (currString.trim().length === 0) {
                return true;
            }
        }
        return true;
    }

    public static removeObjectFromArray(itemToRemove: any, arr: any[]): void {
        let arrLen = arr.length;
        while (arrLen--) {
            let currentItem: any = arr[arrLen];
            if (itemToRemove === currentItem) {
                arr.splice(arrLen, 1);
            }
        }
    }
}