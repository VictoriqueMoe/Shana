import {GuildChannel, GuildMember, Message, Permissions, TextChannel} from "discord.js";
import cronstrue from 'cronstrue';
import {isValidCron} from 'cron-validator';
import {Main} from "../Main";
import {CommandMessage} from "@typeit/discord";
import {MuteModel} from "../model/DB/autoMod/Mute.model";

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
        while (commandLine.indexOf(spaceMarker) > -1) {
            spaceMarker += '@';
        }
        let noSpacesInQuotes = commandLine.replace(/"([^"]*)"?/g, (fullMatch, capture) => capture.replace(/ /g, spaceMarker));
        let mangledParamArray = noSpacesInQuotes.split(/ +/);
        let paramArray = mangledParamArray.map((mangledParam) => mangledParam.replace(RegExp(spaceMarker, 'g'), ' '));
        paramArray.shift();
        return paramArray;
    }
}

export module ChronUtils {
    export function chronToString(chron: string): string {
        if (!isValidCron(chron, {
            seconds: true,
            allowBlankDay: true
        })) {
            throw new ChronException("Chron is not valid");
        }
        return cronstrue.toString(chron);
    }
}

export module DiscordUtils {
    export function findChannelByName(channelName: string): GuildChannel {
        let channels = Main.client.guilds.cache.get(GuildUtils.getGuildID()).channels;
        for (let [, channel] of channels.cache) {
            if (channel.name === channelName) {
                return channel;
            }
        }
        return null;
    }

    export async function postToLog(text: string): Promise<Message> {
        let guild = await Main.client.guilds.fetch(GuildUtils.getGuildID());
        let channel: TextChannel = null;
        if (Main.testMode) {
            channel = await guild.channels.resolve("793994947241312296") as TextChannel; // test channel
        } else {
            channel = await guild.channels.resolve("327484813336641536") as TextChannel;
        }
        return await channel.send(text);
    }

    /**
     * Prevent CP from blocking OE, etc...
     * @param command
     * @private
     */
    export async function canUserPreformBlock(command: CommandMessage): Promise<boolean> {
        let userToBlockCollection = command.mentions.members;
        let userToBlock = userToBlockCollection.values().next().value as GuildMember;
        userToBlock = await userToBlock.fetch(true);
        let userToBlockHighestRole = userToBlock.roles.highest;

        let userPreformingCommand = await command.member.fetch(true);
        userPreformingCommand = await userPreformingCommand.fetch(true);
        let userPreformingActionHigestRole = userPreformingCommand.roles.highest;

        return userPreformingActionHigestRole.position > userToBlockHighestRole.position;
    }

    export async function getUserBlocked(message: Message): Promise<MuteModel> {
        let userWhoPosted = message.member.id;
        return await MuteModel.findOne({
            where: {
                userId: userWhoPosted
            }
        });
    }
}

export class ObjectUtil {
    public static guid(): string {
        function s4(): string {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    public static secondsToHuman(seconds: number): string {
        let levels = [
            [Math.floor(seconds / 31536000), 'years'],
            [Math.floor((seconds % 31536000) / 86400), 'days'],
            [Math.floor(((seconds % 31536000) % 86400) / 3600), 'hours'],
            [Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), 'minutes'],
            [(((seconds % 31536000) % 86400) % 3600) % 60, 'seconds'],
        ];
        let returntext = '';

        for (let i = 0, max = levels.length; i < max; i++) {
            if (levels[i][0] === 0) {
                continue;
            }
            // @ts-ignore
            returntext += ' ' + levels[i][0] + ' ' + (levels[i][0] === 1 ? levels[i][1].substr(0, levels[i][1].length - 1) : levels[i][1]);
        }
        return returntext.trim();
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


export class EnumEx {
    public static getNamesAndValues<T extends number>(e: any): Array<object> {
        return EnumEx.getNames(e).map(n => ({name: n, value: e[n] as T}));
    }

    /**
     * get the numValue associated with it's own key. if you want to get a TypeScript Enum based on an index you can use this
     * @param e
     * @param aName
     * @returns {string|null}
     */
    public static loopBack<T>(e: any, aName: any, asValue: boolean = false): T {
        let keyValuePair: Array<{ name: T, value: any }> = EnumEx.getNamesAndValues(e) as Array<{ name: T, value: any }>;
        for (let i: number = 0; i < keyValuePair.length; i++) {
            let obj: { name: T, value: any } = keyValuePair[i];
            if (asValue) {
                if (obj.value === aName) {
                    return obj.value;
                }
            } else if (obj.name === aName) {
                return obj.name;
            }

        }
        return null;
    }

    public static getNames(e: any): Array<string> {
        return Object.keys(e);
    }

    private static getObjValues(e: any): Array<number | string> {

        return Object.keys(e).map(k => e[k]);
    }
}