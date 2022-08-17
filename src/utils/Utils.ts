import type {
    APIEmbedField,
    AutocompleteInteraction,
    InteractionReplyOptions,
    MessageComponentInteraction
} from "discord.js";
import {
    ChannelType,
    CommandInteraction,
    Guild,
    GuildMember,
    Message,
    MessageContextMenuCommandInteraction,
    Sticker,
    StickerFormatType,
    User
} from "discord.js";
import {container} from "tsyringe";
import type constructor from "tsyringe/dist/typings/types/constructor";

import TIME_UNIT from "../enums/TIME_UNIT.js";
import {Property} from "../model/framework/decorators/Property.js";
import {ISearchBase, SearchBase} from "../model/ISearchBase.js";
import {Typeings} from "../model/Typeings.js";
import axios from "axios";
import {StatusCodes} from "http-status-codes";
import {DataSource} from "typeorm";
import isImageFast from "is-image-fast";
import {Client} from "discordx";
import {RoleManager} from "../model/framework/manager/RoleManager.js";
import {ChannelManager} from "../model/framework/manager/ChannelManager.js";
import Channels from "../enums/Channels.js";
import {EmojiManager} from "../model/framework/manager/EmojiManager.js";
import {DeepPartial} from "typeorm/common/DeepPartial.js";
import {EntityTarget} from "typeorm/common/EntityTarget.js";
import {PermissionFlagsBits} from "discord-api-types/v10";
import {isValidCron} from "cron-validator";
import {CronException} from "../model/exceptions/CronException.js";
import cronstrue from 'cronstrue';

export class Utils {
    public static sleep(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}

export class ObjectUtil {

    /**
     * Ensures value(s) strings and has a size after trim
     * @param strings
     * @returns {boolean}
     */
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

    public static truncate(str: string, limit: number): string {
        return str.length > limit ? `${str.substring(0, limit - 3)}...` : str;
    }

    public static singleFieldBuilder(name: string, value: string, inline = false): [APIEmbedField] {
        return [
            {
                name,
                value,
                inline
            }
        ];
    }

    public static delayFor(ms: number): Promise<void> {
        return new Promise(res => setTimeout(res, ms));
    }

    /**
     * ensures value is an array and has at least 1 item in it
     * @param array
     * @returns {array is any[]}
     */
    public static isValidArray(array: any): array is any[] {
        return Array.isArray(array) && array.length > 0;
    }

    /**
     * Assert argument is an object, and it has more than one key
     * @param obj
     * @returns {obj is Record<string, any>}
     */
    public static isValidObject(obj: unknown): obj is Record<string, any> {
        return typeof obj === "object" && obj !== null && obj !== undefined && Object.keys(obj).length > 0;
    }

    public static convertToMilli(value: number, unit: TIME_UNIT): number {
        switch (unit) {
            case TIME_UNIT.seconds:
                return value * 1000;
            case TIME_UNIT.minutes:
                return value * 60000;
            case TIME_UNIT.hours:
                return value * 3600000;
            case TIME_UNIT.days:
                return value * 86400000;
            case TIME_UNIT.weeks:
                return value * 604800000;
            case TIME_UNIT.months:
                return value * 2629800000;
            case TIME_UNIT.years:
                return value * 31556952000;
            case TIME_UNIT.decades:
                return value * 315569520000;
        }
    }

    public static timeToHuman(value: number, timeUnit: TIME_UNIT = TIME_UNIT.milliseconds): string {
        let seconds: number;
        if (timeUnit === TIME_UNIT.milliseconds) {
            seconds = Math.round(value / 1000);
        } else if (timeUnit !== TIME_UNIT.seconds) {
            seconds = Math.round(ObjectUtil.convertToMilli(value, timeUnit) / 1000);
        } else {
            seconds = Math.round(value);
        }
        if (Number.isNaN(seconds)) {
            throw new Error("Unknown error");
        }
        const levels: [number, string][] = [
            [Math.floor(seconds / 31536000), "years"],
            [Math.floor((seconds % 31536000) / 86400), "days"],
            [Math.floor(((seconds % 31536000) % 86400) / 3600), "hours"],
            [Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), "minutes"],
            [(((seconds % 31536000) % 86400) % 3600) % 60, "seconds"]
        ];
        let returnText = "";

        for (let i = 0, max = levels.length; i < max; i++) {
            if (levels[i][0] === 0) {
                continue;
            }
            returnText += ` ${levels[i][0]} ${levels[i][0] === 1 ? levels[i][1].substr(0, levels[i][1].length - 1) : levels[i][1]}`;
        }
        return returnText.trim();
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

    public static getUrls(str: string): Set<string> {
        const regexp = /(http(s)?:\/\/.)(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)/gim;
        const matches = str.match(regexp);
        if (!ObjectUtil.isValidArray(matches)) {
            return new Set();
        }
        return new Set(matches);
    }

    public static guid(): string {
        function s4(): string {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }

        return `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
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
}

export namespace CronUtils {
    export function cronToString(cron: string): string {
        if (!isValidCron(cron, {
            seconds: true,
            allowBlankDay: true
        })) {
            throw new CronException("cron is not valid");
        }
        return cronstrue.toString(cron);
    }
}

export class DbUtils {

    private static _ds: DataSource;

    /**
     * Build an entity by injecting props as an object
     * @param instance
     * @param data
     */
    public static build<T>(instance: EntityTarget<T>, data: DeepPartial<T>): T {
        if (!DbUtils._ds) {
            DbUtils._ds = container.resolve(DataSource);
        }
        return DbUtils._ds.manager.create(instance, data);
    }
}

export namespace DiscordUtils {

    import envTypes = Typeings.envTypes;
    import EmojiInfo = Typeings.EmojiInfo;
    import StickerInfo = Typeings.StickerInfo;

    export const allChannelsExceptCat = [
        ChannelType.GuildPrivateThread,
        ChannelType.GuildNewsThread,
        ChannelType.GuildVoice,
        ChannelType.GuildNews,
        ChannelType.GuildPublicThread,
        ChannelType.GuildStageVoice,
        ChannelType.GuildDirectory,
        ChannelType.GuildForum,
        ChannelType.GuildText,
    ];

    export class InteractionUtils {

        @Property("NODE_ENV")
        private static readonly environment: envTypes["NODE_ENV"];

        public static getMessageFromContextInteraction(interaction: MessageContextMenuCommandInteraction): Promise<Message | undefined> {
            const messageId = interaction.targetId;
            return interaction.channel.messages.fetch(messageId);
        }

        public static async replyOrFollowUp(interaction: CommandInteraction | MessageComponentInteraction, replyOptions: (InteractionReplyOptions & { ephemeral?: boolean }) | string): Promise<void> {
            // if interaction is already replied
            if (interaction.replied) {
                await interaction.followUp(replyOptions);
                return;
            }

            // if interaction is deferred but not replied
            if (interaction.deferred) {
                await interaction.editReply(replyOptions);
                return;
            }

            // if interaction is not handled yet
            await interaction.reply(replyOptions);
        }

        public static getInteractionCaller(interaction: CommandInteraction | MessageComponentInteraction): GuildMember | null {
            const {member} = interaction;
            if (member == null) {
                InteractionUtils.replyOrFollowUp(interaction, "Unable to extract member");
                throw new Error("Unable to extract member");
            }
            if (member instanceof GuildMember) {
                return member;
            }
            return null;
        }

        public static async search<T extends ISearchBase<SearchBase>>(interaction: AutocompleteInteraction, contextHandler: constructor<T>): Promise<void> {
            const handler = container.resolve(contextHandler);
            const searchResults = await handler.search(interaction);
            if (ObjectUtil.isValidArray(searchResults)) {
                const responseMap = searchResults.map(({item}) => {
                    return {
                        name: item.name,
                        value: item.value
                    };
                });
                return interaction.respond(responseMap);
            }
            return interaction.respond([]);
        }
    }

    export function getGuild(guildId: string): Promise<Guild | null> {
        const client = container.resolve(Client);
        return client.guilds.fetch(guildId);
    }

    export function sanitiseString(str: string): string {
        return str ?? "None";
    }

    export function getAccountAge(user: User | GuildMember, format = false): number | string {
        if (user instanceof GuildMember) {
            user = user.user;
        }
        const createdDate = user.createdAt.getTime();
        const accountAge = Date.now() - createdDate;
        if (format) {
            return ObjectUtil.timeToHuman(accountAge);
        } else {
            return accountAge;
        }
    }

    export function stripUrls(message: Message | string): string {
        const regexp = /(http(s)?:\/\/.)(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)/gm;
        let retStr = typeof message === "string" ? message : message.content;
        retStr = `${retStr}`;
        if (!ObjectUtil.validString(retStr)) {
            return retStr;
        }
        const matches = retStr.match(regexp);
        if (!matches) {
            return retStr;
        }
        for (const match of matches) {
            retStr = retStr.replace(match, "");
        }
        return retStr.trim();
    }

    export function removeMentions(str: string): string {
        return str.replace(/<@.?[0-9]*?>/gm, "");
    }

    export function sanitiseTextForApiConsumption(message: Message | string): string {
        const emojiManager = container.resolve(EmojiManager);
        let retStr = typeof message === "string" ? message : message.content;
        retStr = `${retStr}`;
        retStr = emojiManager.stripAllEmojiFromText(retStr);
        retStr = stripUrls(retStr);
        retStr = removeMentions(retStr);
        return retStr.trim();
    }

    export function isMemberAdmin(member: GuildMember): boolean {
        return member.permissions.has(PermissionFlagsBits.Administrator);
    }

    export async function sendToJail(member: GuildMember, reason: string): Promise<void> {
        if (isMemberAdmin(member)) {
            return;
        }
        const roleManager = container.resolve(RoleManager);
        const guildId = member.guild.id;
        const jailRole = await roleManager.getJailRole(guildId);
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
        const channelManager = container.resolve(ChannelManager);
        const jailChannel = await channelManager.getChannel(guildId, Channels.JAIL_CHANNEL);
        if (!jailChannel) {
            return;
        }
        jailChannel.send(`<@${member.id}>`);
        setTimeout(() => {
            jailChannel.send(`<@${member.id}>, ${reason}`);
        }, 6000);
    }

    /**
     * Obtains image URL for a message on this order:
     * message Attachments
     * message URL
     * reference message
     * @param message
     * @param ignore -  supply true to each prop you want to ignore
     */
    export async function getImageUrlsFromMessageOrReference(message: Message, ignore: { attachments?: boolean, url?: boolean, ref?: boolean } = {
        url: false,
        attachments: false,
        ref: false
    }): Promise<Set<string>> {
        const messageAttachments = message.attachments;
        if (!ignore.attachments && messageAttachments && messageAttachments.size > 0) {
            const attachmentUrls: string[] = messageAttachments.map(value => value.attachment).filter(attachment => ObjectUtil.validString(attachment)) as string[];
            const urlMessageSet = new Set<string>();
            if (ObjectUtil.isValidArray(attachmentUrls)) {
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
        const messageContent = message.content;
        if (!ignore.url && ObjectUtil.validString(messageContent)) {
            const urlsInMessage = ObjectUtil.getUrls(messageContent);
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
        if (!ignore.ref) {
            const repliedMessageRef = message.reference;
            const urlMessageSet = new Set<string>();
            if (repliedMessageRef) {
                const repliedMessageID = repliedMessageRef.messageId;
                const repliedMessageObj = await message.channel.messages.fetch(repliedMessageID);
                const repliedMessageContent = repliedMessageObj.content;
                const repliedMessageAttach = (repliedMessageObj.attachments && repliedMessageObj.attachments.size > 0) ? repliedMessageObj.attachments : null;
                if (repliedMessageAttach) {
                    const repliedMessageAttach = repliedMessageObj.attachments;
                    const attachmentUrls: string[] = repliedMessageAttach.map(value => value.attachment).filter(attachment => ObjectUtil.validString(attachment)) as string[];
                    if (ObjectUtil.isValidArray(attachmentUrls)) {
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
                    const urlsInMessage = ObjectUtil.getUrls(repliedMessageObj.content);
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
        return new Set();
    }

    export async function loadResourceFromURL(url: string): Promise<Buffer> {
        const response = await axios.get(url, {
            responseType: "arraybuffer"
        });
        const buffer: Buffer = response.data;
        if (response.status !== StatusCodes.OK) {
            throw new Error(buffer.toString("utf-8"));
        }
        return buffer;
    }

    export async function getStickerInfo(sticker: Sticker, includeBuffer = true): Promise<StickerInfo> {
        const {url, format, id} = sticker;
        const retObj: StickerInfo = {
            url,
            id
        };
        if (!includeBuffer) {
            return retObj;
        }
        if (format === StickerFormatType.Lottie) {
            retObj["buffer"] = Buffer.from(url, 'utf8');
        } else {
            try {
                retObj["buffer"] = await DiscordUtils.loadResourceFromURL(url);
            } catch {

            }
        }
        return retObj;
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

}

export class EnumEx {

    public static getNamesAndValues<T extends number>(e: any): Array<unknown> {
        return EnumEx.getNames(e).map(n => ({name: n, value: e[n] as T}));
    }

    /**
     * get the numValue associated with its own key. if you want to get a TypeScript Enum based on an index you can use this
     * @param e
     * @param aName
     * @param asValue
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
