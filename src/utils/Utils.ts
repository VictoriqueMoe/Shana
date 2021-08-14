import {
    Guild,
    GuildAuditLogs,
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
import {MuteModel} from "../model/DB/autoMod/impl/Mute.model";
import {CloseOptionModel} from "../model/DB/autoMod/impl/CloseOption.model";
import {Model, Sequelize} from "sequelize-typescript";
import {defaults} from "request";
import {glob} from "glob";
import * as path from "path";
import {Channels} from "../enums/Channels";
import {ChannelManager} from "../model/guild/manager/ChannelManager";
import {GuildManager} from "../model/guild/manager/GuildManager";
import {SettingsManager} from "../model/settings/SettingsManager";
import {SETTINGS} from "../enums/SETTINGS";
import {IncomingMessage} from "http";
import {ICloseableModule} from "../model/closeableModules/ICloseableModule";
import {CommandMessage} from "discordx";
import {Typeings} from "../model/types/Typeings";

const getUrls = require('get-urls');
const emojiRegex = require('emoji-regex/es2015/index.js');
const isImageFast = require('is-image-fast');
const request = defaults({encoding: null});

export class ChronException extends Error {
    constructor(e: string) {
        super(e);

        Object.setPrototypeOf(this, ChronException.prototype);
    }
}

export function loadClasses(...paths: string[]): Promise<any[]> {
    const globs = paths.map(globPath => glob.sync(globPath));
    const pArr = globs.flatMap(filePaths => {
        return filePaths.map(filePath => import(path.resolve(filePath)));
    });
    return Promise.all(pArr);
}

export namespace GuildUtils {
    export const vicBotId = "806288433323966514";

    export namespace RoleUtils {

        export async function isValidRole(guildId: string, role: string | Role): Promise<boolean> {
            const guild = await GuildManager.instance.getGuild(guildId);
            const roleId = typeof role === "string" ? role : role.id;
            const guildRoles = [...guild.roles.cache.values()];
            for (const guildRole of guildRoles) {
                if (guildRole.id === roleId) {
                    if (guildRole.managed) {
                        return false;
                    }
                    return guildRole.name !== "@everyone";
                }
            }
            return false;
        }

        export function getJailRole(guildId: string): Promise<Role | null> {
            return getRole(guildId, SETTINGS.JAIL_ROLE);
        }

        export function getYoungAccountRole(guildId: string): Promise<Role | null> {
            return getRole(guildId, SETTINGS.YOUNG_ACCOUNT_ROLE);
        }

        export function getMuteRole(guildId: string): Promise<Role | null> {
            return getRole(guildId, SETTINGS.MUTE_ROLE);
        }

        export function getAutoRole(guildId: string): Promise<Role | null> {
            return getRole(guildId, SETTINGS.AUTO_ROLE);
        }

        async function getRole(guildId: string, setting: SETTINGS): Promise<Role | null> {
            const role = await SettingsManager.instance.getSetting(setting, guildId);
            if (!ObjectUtil.validString(role)) {
                return null;
            }
            try {
                const guild = await GuildManager.instance.getGuild(guildId);
                return guild.roles.fetch(role);
            } catch {
                return null;
            }
        }
    }

    export async function applyPanicModeRole(member: GuildMember): Promise<void> {
        const guildId = member.guild.id;
        const guild = await GuildManager.instance.getGuild(guildId);
        return applyUnverified(member, `Hello, we have detected unusual mass joins on our server recently, we must verify your account before you can access the ${guild.name} Discord Server`, guild, true);
    }

    export async function applyYoungAccountConstraint(member: GuildMember, timeout: string): Promise<void> {
        const guildId = member.guild.id;
        const guild = await GuildManager.instance.getGuild(guildId);
        return applyUnverified(member, `Hello, as your Discord account is less than ${timeout} old and because of recent scams, we must verify your account before you can access the ${guild.name} Discord Server`, guild);
    }

    async function applyUnverified(member: GuildMember, dmStr: string, guild: Guild, panicMode = false): Promise<void> {
        if (GuildUtils.isMemberAdmin(member)) {
            return;
        }
        const guildId = guild.id;
        const unverifiedRole = await GuildUtils.RoleUtils.getYoungAccountRole(guildId);
        if (!unverifiedRole) {
            throw new Error("Unable to find Unverified account role");
        }
        await member.roles.set([unverifiedRole]);
        if (!panicMode) {
            DiscordUtils.postToLog(`Member <@${member.id}> ${member.user.tag} has been applied the ${unverifiedRole.name} role`, guildId);
        }

        let message = dmStr;
        const jailChannel = await ChannelManager.instance.getJailChannel(guild.id);
        if (jailChannel) {
            message += `\nPlease post in the #${jailChannel.name} channel for faster verification process`;
        }
        await member.send(message);
    }

    export async function sendToJail(member: GuildMember, reason: string): Promise<void> {
        if (GuildUtils.isMemberAdmin(member)) {
            return;
        }
        const guildId = member.guild.id;
        const jailRole = await GuildUtils.RoleUtils.getJailRole(guildId);
        if (!jailRole) {
            return;
        }
        const isAlreadyInJail = member.roles.cache.has(jailRole.id);
        if (isAlreadyInJail) {
            return;
        }
        for (const [roleId] of member.roles.cache) {
            try {
                if (roleId === jailRole.id) {
                    continue;
                }
                await member.roles.remove(roleId);
            } catch {
            }
        }
        await member.roles.add(jailRole);
        const jailChannel = await ChannelManager.instance.getJailChannel(guildId);
        if (!jailChannel) {
            return;
        }
        jailChannel.send(`<@${member.id}>`);
        setTimeout(() => {
            jailChannel.send(`<@${member.id}>, ${reason}`);
        }, 6000);
    }


    export function getGuildIconUrl(guildId: string): string {
        const guild = Main.client.guilds.cache.get(guildId);
        return guild.iconURL({
            dynamic: true,
        });
    }

    export function getGuildName(guildId: string): string {
        const guild = Main.client.guilds.cache.get(guildId);
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

    export async function getAutoBotIds(guildId: string): Promise<string[]> {
        const guild = await GuildManager.instance.getGuild(guildId);
        const membersCollection = guild.members.cache;
        const reArr: string[] = [];
        for (const [id, member] of membersCollection) {
            if (member.user.bot) {
                reArr.push(id);
            }
        }
        return reArr;
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

    export function truncate(str: string, limit: number): string {
        return str.length > limit ? `${str.substring(0, limit - 3)}...` : str;
    }
}

export namespace Ffmpeg {

    const {promisify} = require('util');
    const execFile = promisify(require('child_process').execFile);
    const pathToFfmpeg = require('ffmpeg-static');

    export async function checkVideo(file: string, obufferSize: number): Promise<string[]> {
        const info: string[] = [];
        try {
            const {stderr} = await execFile(pathToFfmpeg, ['-v', 'debug', '-nostats', '-i', file, '-f', 'null', '-',], {
                maxBuffer: obufferSize
            });
            if (stderr) {
                info.push(stderr);
            }
        } catch (err) {
            info.push(err.message);
        }

        return info;
    }
}

export namespace ArrayUtils {
    export function isValidArray(array: any): boolean {
        return Array.isArray(array) && array.length > 0;
    }
}

export namespace TimeUtils {
    export enum TIME_UNIT {
        seconds = "s",
        minutes = "mi",
        hours = "h",
        days = "d",
        weeks = "w",
        months = "mo",
        years = "y",
        decades = "de"
    }

    export function convertToMilli(value: number, unit: TIME_UNIT): number {
        switch (unit) {
            case TimeUtils.TIME_UNIT.seconds:
                return value * 1000;
            case TimeUtils.TIME_UNIT.minutes:
                return value * 60000;
            case TimeUtils.TIME_UNIT.hours:
                return value * 3600000;
            case TimeUtils.TIME_UNIT.days:
                return value * 86400000;
            case TimeUtils.TIME_UNIT.weeks:
                return value * 604800000;
            case TimeUtils.TIME_UNIT.months:
                return value * 2629800000;
            case TimeUtils.TIME_UNIT.years:
                return value * 31556952000;
            case TimeUtils.TIME_UNIT.decades:
                return value * 315569520000;
        }
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
    export type EmojiInfo = {
        "buffer"?: Buffer,
        "url": string,
        "id": string
    };

    export async function getBot(guildId: string): Promise<GuildMember> {
        const guild = await GuildManager.instance.getGuild(guildId);
        return guild.me;
    }

    export async function getEmojiInfo(emojiId: string, includeBuffer = true): Promise<EmojiInfo> {
        let emojiInfo: EmojiInfo = null;
        const tryExtensions = ["gif", "png"];
        for (let i = 0; i < tryExtensions.length; i++) {
            const ext = tryExtensions[i];
            const url = `https://cdn.discordapp.com/emojis/${emojiId}.${ext}`;
            try {
                const emojiImageBuffer = await DiscordUtils.loadResourceFromURL(url);
                if (emojiImageBuffer.length > 0) {
                    emojiInfo = {
                        url: url,
                        id: emojiId
                    };
                    if (includeBuffer) {
                        emojiInfo["buffer"] = emojiImageBuffer;
                    }
                    break;
                }
            } catch {

            }
        }
        if (!emojiInfo) {
            throw new Error("Error finding emoji");
        }
        return emojiInfo;
    }


    /**
     * Obtains image URL for a message on this order:
     * message Attachments
     * message URL
     * reference message
     * @param command
     */
    export async function getImageUrlsFromMessageOrReference(command: CommandMessage): Promise<Set<string>> {
        const messageAttachments = command.attachments;
        if (messageAttachments && messageAttachments.size > 0) {
            const attachmentUrls: string[] = messageAttachments.map(value => value.attachment).filter(attachment => ObjectUtil.validString(attachment)) as string[];
            const urlMessageSet = new Set<string>();
            if (ArrayUtils.isValidArray(attachmentUrls)) {
                for (const attachmentUrl of attachmentUrls) {
                    if (await isImageFast(attachmentUrl)) {
                        urlMessageSet.add(attachmentUrl);
                    }
                }
            }
            if (urlMessageSet.size > 0) {
                return urlMessageSet;
            }
        }

        // message URL
        const messageContent = command.content;
        if (ObjectUtil.validString(messageContent)) {
            const urlsInMessage = getUrls(messageContent);
            if (urlsInMessage && urlsInMessage.size > 0) {
                const urlMessageSet = new Set<string>();
                for (const url of urlsInMessage) {
                    if (await isImageFast(url)) {
                        urlMessageSet.add(url);
                    }
                }
                if (urlMessageSet.size > 0) {
                    return urlMessageSet;
                }
            }
        }
        // replied attachment
        {
            const repliedMessageRef = command.reference;
            const urlMessageSet = new Set<string>();
            if (repliedMessageRef) {
                const repliedMessageID = repliedMessageRef.messageId;
                const repliedMessageObj = await command.channel.messages.fetch(repliedMessageID);
                const repliedMessageContent = repliedMessageObj.content;
                const repliedMessageAttatch = (repliedMessageObj.attachments && repliedMessageObj.attachments.size > 0) ? repliedMessageObj.attachments : null;
                if (repliedMessageAttatch) {
                    const repliedMessageAttatch = repliedMessageObj.attachments;
                    const attachmentUrls: string[] = repliedMessageAttatch.map(value => value.attachment).filter(attachment => ObjectUtil.validString(attachment)) as string[];
                    if (ArrayUtils.isValidArray(attachmentUrls)) {
                        for (const attachmentUrl of attachmentUrls) {
                            if (await isImageFast(attachmentUrl)) {
                                urlMessageSet.add(attachmentUrl);
                            }
                        }
                    }
                    if (urlMessageSet.size > 0) {
                        return urlMessageSet;
                    }
                }

                if (ObjectUtil.validString(repliedMessageContent)) {
                    const urlsInMessage = getUrls(repliedMessageObj.content);
                    if (urlsInMessage && urlsInMessage.size > 0) {
                        for (const urlInMessage of urlsInMessage) {
                            if (await isImageFast(urlInMessage)) {
                                urlMessageSet.add(urlInMessage);
                            }
                        }

                    }
                }
                if (urlMessageSet.size > 0) {
                    return urlMessageSet;
                }
            }

            return new Set();
        }
    }


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
        const retObj: RoleChange = {};
        const added = oldRole.permissions.missing(newRole.permissions.bitfield);
        const removed = newRole.permissions.missing(oldRole.permissions.bitfield);

        if (added.length > 0 || removed.length > 0) {
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

    export function findChannelByName(channelName: string, guildId: string): Typeings.AbstractChannel {
        const channels = Main.client.guilds.cache.get(guildId).channels;
        for (const [, channel] of channels.cache) {
            if (channel.name === channelName) {
                return channel;
            }
        }
        return null;
    }

    export function loadResourceFromURL(url: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            request.get(url, function (err: string, resp: IncomingMessage, buffer: Buffer) {
                if (err) {
                    console.error(err, url);
                    reject(err);
                    return;
                }
                if (resp.statusCode !== 200) {
                    reject(buffer.toString("utf-8"));
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

    export function getEmojiFromMessage(message: Message, includeDefaultEmoji = true): string[] {
        const regex = new RegExp(/<(a?):(\w+):(\d+)>/, "g");
        const messageText = message.content;
        const emojiArray = messageText.match(regex) || [];
        if (includeDefaultEmoji) {
            const emoJiRexp = emojiRegex();
            let match: string[];
            while ((match = emoJiRexp.exec(messageText)) !== null) {
                const emoji = match[0];
                emojiArray.push(emoji);
            }
        }
        return emojiArray;
    }

    export async function postToLog(message: MessageEmbed[] | string, guildId: string, adminLog = false): Promise<Message | null> {
        let channel: TextChannel;
        if (Main.testMode) {
            const guild = await Main.client.guilds.fetch(guildId);
            channel = await guild.channels.resolve(Channels.TEST_CHANNEL) as TextChannel;
        } else if (adminLog) {
            // channel = await guild.channels.resolve(Channels.ADMIN_LOG) as TextChannel;
            channel = await ChannelManager.instance.getAdminLogChannel(guildId);
        } else {
            channel = await ChannelManager.instance.getLogChannel(guildId);
        }
        if (channel == null) {
            return Promise.resolve(null);
        }
        if (ArrayUtils.isValidArray(message)) {
            return await channel.send({embeds: message as MessageEmbed[]});
        } else {
            return await channel.send(message as string);
        }
    }

    /**
     * Please note: if you are checking for an entry of one you are NOT listening to, you will need to check the creation date against user join date for ALL events
     * @param type
     * @param guild
     */
    export async function getAuditLogEntry(type: GuildAuditLogsAction, guild: Guild): Promise<GuildAuditLogsEntry> {
        const fetchedAuditLog = await getAuditLogEntries(type, guild);
        const logEntry = fetchedAuditLog.entries.first();
        if (!logEntry) {
            return null;
        }
        return logEntry;
    }

    /**
     * Get all entries from the audit log with optinal limit
     * @param type
     * @param guild
     * @param limit
     */
    export async function getAuditLogEntries(type: GuildAuditLogsAction, guild: Guild, limit = 1): Promise<GuildAuditLogs | null> {
        const fetchObj: GuildAuditLogsFetchOptions = {
            limit,
            type
        };
        try {
            return await guild.fetchAuditLogs(fetchObj);
        } catch {
            return null;
        }
    }

    /**
     * Prevent CP from blocking OE, etc...
     * @param command
     * @private
     */
    export async function canUserPreformBlock(command: CommandMessage): Promise<boolean> {
        const userToBlockCollection = command.mentions.members;
        const userToBlock = userToBlockCollection.values().next().value as GuildMember;
        const userToBlockHighestRole = userToBlock.roles.highest;
        const userPreformingCommand = await command.member;
        const userPreformingActionHigestRole = userPreformingCommand.roles.highest;
        return userPreformingActionHigestRole.position > userToBlockHighestRole.position;
    }

    export async function getUserBlocked(message: Message): Promise<MuteModel> {
        const userWhoPosted = message.member.id;
        return await MuteModel.findOne({
            where: {
                userId: userWhoPosted,
                guildId: message.member.guild.id
            }
        });
    }

    export async function getAllClosableModules(guildId: string): Promise<string[]> {
        const allModules = await CloseOptionModel.findAll({
            attributes: [
                [
                    Sequelize.fn('DISTINCT', Sequelize.col('moduleId')), 'moduleId'
                ]
            ],
            where: {
                guildId
            }
        });
        return allModules.map(m => m.moduleId);
    }

    export function getModule(moduleId: string): ICloseableModule<any> {
        const modules = Main.closeableModules;
        for (const module of modules) {
            if (module.moduleId === moduleId) {
                return module;
            }
        }
        return null;
    }

    export function getDynoReplacementModules(): ICloseableModule<any>[] {
        const modules = Main.closeableModules;
        const returnArr: ICloseableModule<any>[] = [];
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

    public static isNumeric(n: string): boolean {
        // @ts-ignore
        return !isNaN(parseFloat(n)) && isFinite(n);
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
            returntext += ` ${levels[i][0]} ${levels[i][0] === 1 ? levels[i][1].substr(0, levels[i][1].length - 1) : levels[i][1]}`;
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

export namespace ModelUtils {

    export namespace EventSecurityConstraintUtils {

        export function getRoles(this: Model, prop: string): Role[] {
            const value: string | null = this.getDataValue(prop);
            if (!ObjectUtil.validString(value)) {
                return [];
            }
            const guild = getGuild.call(this);
            const roleIds = value.split(",");
            return roleIds.map(roleId => guild.roles.cache.get(roleId));
        }

        export function setRoles(this: Model, roles: string[], prop: string): void {
            if (!ArrayUtils.isValidArray(roles)) {
                this.setDataValue(prop, null);
                return;
            }
            this.setDataValue(prop, roles.join(","));
        }

        export function getChannels(this: Model, prop: string): GuildChannel[] {
            const value: string | null = this.getDataValue(prop);
            if (!ObjectUtil.validString(value)) {
                return [];
            }
            const guild = getGuild.call(this);
            const channels = value.split(",");
            return channels.map(channelId => guild.channels.cache.get(channelId));
        }

        export function setChannels(this: Model, channels: string[], prop: string): void {
            if (!ArrayUtils.isValidArray(channels)) {
                this.setDataValue(prop, null);
                return;
            }
            this.setDataValue(prop, channels.join(","));
        }
    }

    function getGuild(this: Model): Guild {
        return Main.client.guilds.cache.get(this.getDataValue("guildId"));
    }
}