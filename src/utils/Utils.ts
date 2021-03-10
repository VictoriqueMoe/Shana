import {
    Guild,
    GuildAuditLogsAction,
    GuildAuditLogsEntry,
    GuildAuditLogsFetchOptions,
    GuildChannel,
    GuildMember,
    Message,
    MessageEmbed,
    Permissions,
    Role,
    TextChannel,
    User
} from "discord.js";
import cronstrue from 'cronstrue';
import {isValidCron} from 'cron-validator';
import {Main} from "../Main";
import {CommandMessage} from "@typeit/discord";
import {MuteModel} from "../model/DB/autoMod/impl/Mute.model";
import {CloseableModule} from "../model/closeableModules/impl/CloseableModule";
import {CloseOptionModel} from "../model/DB/autoMod/impl/CloseOption.model";
import {Sequelize} from "sequelize-typescript";
import {defaults} from "request";
import {glob} from "glob";
import * as path from "path";
import {Channels} from "../enums/Channels";

const emojiRegex = require('emoji-regex/es2015/index.js');

const request = defaults({encoding: null});

const {GuildID} = require('../../config.json');

export class ChronException extends Error {
    constructor(e: string) {
        super(e);

        Object.setPrototypeOf(this, ChronException.prototype);
    }
}

export function loadClasses(...paths: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        let i = 0;
        for (const pathRes of paths) {
            glob(pathRes, (err, files) => {
                i++;
                for (const file of files) {
                    console.log(`Load class: "${file}"`);
                    try {
                        require(path.resolve(file));
                    } catch (e) {
                        reject(e);
                    }
                }
                if (i === paths.length) {
                    resolve();
                }
            });
        }
    });
}

export namespace GuildUtils {
    export const vicBotId = "806288433323966514";

    export function getGuildID(): string {
        return GuildID as string;
    }

    export function getGuildIconUrl(): string {
        const guild = Main.client.guilds.cache.get(GuildUtils.getGuildID());
        return guild.iconURL({
            dynamic: true,
        });
    }

    export function getGuildName(): string {
        const guild = Main.client.guilds.cache.get(GuildUtils.getGuildID());
        return guild.name;
    }

    export function isMemberAdmin(member: GuildMember): boolean {
        const memberRoles = member.roles.cache;
        for (const [, role] of memberRoles) {
            const perms = role.permissions;
            const isAdmin = perms.has(Permissions.FLAGS.ADMINISTRATOR, true);
            if (isAdmin) {
                return true;
            }
        }
        return false;
    }

    export function getAutoBotIds(): string[] {
        return ["159985870458322944", "155149108183695360", GuildUtils.vicBotId];
    }

}

export namespace StringUtils {
    export function splitCommandLine(commandLine: string): string[] {
        let spaceMarker = '<SP>';
        while (commandLine.indexOf(spaceMarker) > -1) {
            spaceMarker += '@';
        }
        const noSpacesInQuotes = commandLine.replace(/"([^"]*)"?/g, (fullMatch, capture) => capture.replace(/ /g, spaceMarker));
        const mangledParamArray = noSpacesInQuotes.split(/ +/);
        const paramArray = mangledParamArray.map((mangledParam) => mangledParam.replace(RegExp(spaceMarker, 'g'), ' '));
        paramArray.shift();
        return paramArray;
    }
}

export namespace ChronUtils {
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

export namespace DiscordUtils {


    export type RoleChange = {
        permissions?: {
            added: string[]
            removed: string[],
        },
        nameChange?: {
            before: string,
            after: string
        },
        colourChange?: {
            before: string,
            after: string
        }
    };

    export function getRoleChanges(oldRole: Role, newRole: Role): RoleChange {
        const retObj:RoleChange = {};
        const added = oldRole.permissions.missing(newRole.permissions.bitfield);
        const removed = newRole.permissions.missing(oldRole.permissions.bitfield);

        if(added.length > 0 || removed.length > 0){
            retObj["permissions"] = {
                added,
                removed
            };
        }
        const oldName = oldRole.name;
        const newName = newRole.name;
        if (oldName !== newName) {
            retObj["nameChange"] = {
                "before": oldName,
                "after": newName
            };
        }

        const oldColour = oldRole.hexColor;
        const newColour = newRole.hexColor;
        if (oldColour !== newColour) {
            retObj["colourChange"] = {
                "before": oldColour,
                "after": newColour
            };
        }

        return retObj;
    }

    export function findChannelByName(channelName: string): GuildChannel {
        const channels = Main.client.guilds.cache.get(GuildUtils.getGuildID()).channels;
        for (const [, channel] of channels.cache) {
            if (channel.name === channelName) {
                return channel;
            }
        }
        return null;
    }

    export function loadResourceFromURL(url: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            request.get(url, function (err, resp, buffer) {
                if (err) {
                    console.error(err, url);
                    reject(err);
                    return;
                }
                resolve(buffer);
            });
        });
    }

    export function getAccountAge(user: User | GuildMember, format = false): number | string {
        if (user instanceof GuildMember) {
            user = user.user;
        }
        const createdDate = user.createdAt.getTime();
        const accountAge = Date.now() - createdDate;
        if (format) {
            return ObjectUtil.secondsToHuman(Math.round(accountAge / 1000));
        } else {
            return accountAge;
        }
    }

    export function getEmojiFromMessage(message: Message): string[] {
        const regex = new RegExp(/<(a?):(\w+):(\d+)>/, "g");
        const messageText = message.content;
        const emojiArray = messageText.match(regex) || [];
        const emoJiRexp = emojiRegex();
        let match;
        // eslint-disable-next-line no-cond-assign
        while (match = emoJiRexp.exec(messageText)) {
            const emoji = match[0];
            emojiArray.push(emoji);
        }
        return emojiArray;
    }

    export async function postToLog(message: MessageEmbed | string, adminLog = false): Promise<Message> {
        const guild = await Main.client.guilds.fetch(GuildUtils.getGuildID());
        let channel: TextChannel;
        if (Main.testMode) {
            channel = await guild.channels.resolve(Channels.TEST_CHANNEL) as TextChannel;
        } else if (adminLog) {
            channel = await guild.channels.resolve(Channels.ADMIN_LOG) as TextChannel;
        } else {
            channel = await guild.channels.resolve(Channels.LOG_CHANNEL) as TextChannel;
        }
        return await channel.send(message);
    }

    /**
     * Please note: if you are checking for an entry of one you are NOT listening to, you will need to check the creation date against user join date for ALL events
     * @param type
     * @param guild
     */
    export async function getAuditLogEntry(type: GuildAuditLogsAction, guild: Guild): Promise<GuildAuditLogsEntry> {
        const fetchObj: GuildAuditLogsFetchOptions = {
            limit: 1,
            type
        };
        const fetchedAuditLog = await guild.fetchAuditLogs(fetchObj);
        const logEntry = fetchedAuditLog.entries.first();
        if (!logEntry) {
            return null;
        }
        return logEntry;
    }

    /**
     * Prevent CP from blocking OE, etc...
     * @param command
     * @private
     */
    export async function canUserPreformBlock(command: CommandMessage): Promise<boolean> {
        const userToBlockCollection = command.mentions.members;
        let userToBlock = userToBlockCollection.values().next().value as GuildMember;
        userToBlock = await userToBlock.fetch(true);
        const userToBlockHighestRole = userToBlock.roles.highest;

        let userPreformingCommand = await command.member.fetch(true);
        userPreformingCommand = await userPreformingCommand.fetch(true);
        const userPreformingActionHigestRole = userPreformingCommand.roles.highest;

        return userPreformingActionHigestRole.position > userToBlockHighestRole.position;
    }

    export async function getUserBlocked(message: Message): Promise<MuteModel> {
        const userWhoPosted = message.member.id;
        return await MuteModel.findOne({
            where: {
                userId: userWhoPosted
            }
        });
    }

    export async function getAllClosableModules(): Promise<string[]> {
        const allModules = await CloseOptionModel.findAll({
            attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('moduleId')), 'moduleId']],
            where: {}
        });
        return allModules.map(m => m.moduleId);
    }

    export function getModule(moduleId: string): CloseableModule {
        const modules = Main.closeableModules;
        for (const module of modules) {
            if (module.moduleId === moduleId) {
                return module;
            }
        }
        return null;
    }

    export function getDynoReplacementModules(): CloseableModule[] {
        const modules = Main.closeableModules;
        const returnArr: CloseableModule[] = [];
        for (const module of modules) {
            if (module.isDynoReplacement) {
                returnArr.push(module);
            }
        }
        return returnArr;
    }
}

export class ObjectUtil {
    public static guid(): string {
        function s4(): string {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    public static getAmountOfCapsAsPercentage(valueCheck: string): number {
        if (!ObjectUtil.validString(valueCheck)) {
            return 0;
        }

        function isUpper(str: string): boolean {
            return !/[a-z]/.test(str) && /[A-Z]/.test(str);
        }

        valueCheck = valueCheck.trim();
        valueCheck = valueCheck.replace(/\s/g, '');
        const stringLength = valueCheck.length;
        const amountOfCaps = valueCheck.split("").filter(char => isUpper(char)).length;
        return Math.floor((amountOfCaps * 100) / stringLength);
    }

    public static isValidObject(obj: unknown): boolean {
        return typeof obj === "object" && obj !== null && obj !== undefined && Object.keys(obj).length > 0;
    }

    public static secondsToHuman(seconds: number): string {
        const levels = [
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
        for (const currString of strings) {
            if (typeof currString !== "string") {
                return false;
            }
            if (currString.length === 0) {
                return false;
            }
            if (currString.trim().length === 0) {
                return false;
            }
        }
        return true;
    }

    public static removeObjectFromArray(itemToRemove: any, arr: any[]): void {
        let arrLen = arr.length;
        while (arrLen--) {
            const currentItem: any = arr[arrLen];
            if (itemToRemove === currentItem) {
                arr.splice(arrLen, 1);
            }
        }
    }
}


export class EnumEx {
    public static getNamesAndValues<T extends number>(e: any): Array<unknown> {
        return EnumEx.getNames(e).map(n => ({name: n, value: e[n] as T}));
    }

    /**
     * get the numValue associated with it's own key. if you want to get a TypeScript Enum based on an index you can use this
     * @param e
     * @param aName
     * @returns {string|null}
     */
    public static loopBack<T>(e: any, aName: any, asValue = false): T {
        const keyValuePair: Array<{ name: T, value: any }> = EnumEx.getNamesAndValues(e) as Array<{ name: T, value: any }>;
        for (let i = 0; i < keyValuePair.length; i++) {
            const obj: { name: T, value: any } = keyValuePair[i];
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