import {
    AutocompleteInteraction,
    BaseCommandInteraction,
    BaseGuildTextChannel,
    CategoryChannel,
    ContextMenuInteraction,
    Guild,
    GuildAuditLogs,
    GuildAuditLogsAction,
    GuildAuditLogsEntry,
    GuildAuditLogsFetchOptions,
    GuildChannel,
    GuildMember,
    HexColorString,
    Message,
    MessageComponentInteraction,
    MessageEmbed,
    Permissions,
    Role,
    StaticImageURLOptions,
    Sticker,
    TextChannel,
    ThreadAutoArchiveDuration,
    ThreadChannel,
    User
} from "discord.js";
import cronstrue from 'cronstrue';
import {isValidCron} from 'cron-validator';
import {CloseOptionModel} from "../model/DB/autoMod/impl/CloseOption.model";
import {glob} from "glob";
import * as path from "path";
import {ChannelManager} from "../model/guild/manager/ChannelManager";
import {GuildManager} from "../model/guild/manager/GuildManager";
import {SettingsManager} from "../model/settings/SettingsManager";
import {SETTINGS} from "../enums/SETTINGS";
import {ICloseableModule} from "../model/closeableModules/ICloseableModule";
import fetch from "node-fetch";
import {StatusCodes} from "http-status-codes";
import {Typeings} from "../model/types/Typeings";
import {container} from "tsyringe";
import {CloseableModule} from "../model/closeableModules/impl/CloseableModule";
import {Client, DApplicationCommand} from "discordx";
import {Beans} from "../DI/Beans";
import {getRepository} from "typeorm";
import {ISearchBase, SearchBase} from "../model/ISearchBase";
import {Channels} from "../enums/Channels";

const emojiRegex = require('emoji-regex');
const isImageFast = require('is-image-fast');

export class CronException extends Error {
    constructor(e: string) {
        super(e);

        Object.setPrototypeOf(this, CronException.prototype);
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
    const settingsManager = container.resolve(SettingsManager);

    export namespace RoleUtils {

        export async function isValidRole(guildId: string, role: string | Role): Promise<boolean> {
            const guildManager = container.resolve(GuildManager);
            const guild = await guildManager.getGuild(guildId);
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

        async function getRole(guildId: string, setting: SETTINGS): Promise<Role | null> {
            const role = await settingsManager.getSetting(setting, guildId);
            if (!ObjectUtil.validString(role)) {
                return null;
            }
            let roleResolved: Role = null;
            try {
                const guildManager = container.resolve(GuildManager);
                const guild = await guildManager.getGuild(guildId);
                roleResolved = await guild.roles.fetch(role);
            } catch {
                return null;
            }
            return roleResolved;
        }
    }

    export async function applyPanicModeRole(member: GuildMember): Promise<void> {
        const guildId = member.guild.id;
        const guildManager = container.resolve(GuildManager);
        const guild = await guildManager.getGuild(guildId);
        return applyUnverified(member, `Hello, we have detected unusual mass joins on our server recently, we must verify your account before you can access the ${guild.name} Discord Server`, guild, true);
    }

    export async function applyYoungAccountConstraint(member: GuildMember, timeout: string): Promise<void> {
        const guildId = member.guild.id;
        const guildManager = container.resolve(GuildManager);
        const guild = await guildManager.getGuild(guildId);
        return applyUnverified(member, `Hello, as your Discord account is less than ${timeout} old and because of recent scams, we must verify your account before you can access the ${guild.name} Discord Server`, guild);
    }

    async function applyUnverified(member: GuildMember, dmStr: string, guild: Guild, panicMode: boolean = false): Promise<void> {
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
        const channelManager = container.resolve(ChannelManager);
        const jailChannel = await channelManager.getChannel(guild.id, Channels.JAIL_CHANNEL);
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


    export function getGuildIconUrl(guildId: string): string {
        const client = container.resolve(Client);
        const guild = client.guilds.cache.get(guildId);
        return guild.iconURL({
            dynamic: true,
        });
    }

    export function getGuildName(guildId: string): string {
        const client = container.resolve(Client);
        const guild = client.guilds.cache.get(guildId);
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
        const guildManager = container.resolve(GuildManager);
        const guild = await guildManager.getGuild(guildId);
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
    export function isValidArray(array: any): array is any[] {
        return Array.isArray(array) && array.length > 0;
    }
}

export namespace TimeUtils {
    export enum TIME_UNIT {
        milliseconds = "mil",
        seconds = "s",
        minutes = "mi",
        hours = "h",
        days = "d",
        weeks = "w",
        months = "mo",
        years = "y",
        decades = "de"
    }

    export enum METHOD_EXECUTOR_TIME_UNIT {
        seconds = "seconds",
        minutes = "minutes",
        hours = "hours",
        days = "days",
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


export namespace DiscordUtils {

    import ObjectChange = Typeings.ObjectChange;
    export namespace InteractionUtils {

        export function getUserFromUserContextInteraction(interaction: ContextMenuInteraction): GuildMember | undefined {
            const memberId = interaction.targetId;
            return interaction.guild.members.cache.get(memberId);
        }

        export function getMessageFromContextInteraction(interaction: ContextMenuInteraction): Promise<Message | undefined> {
            const messageId = interaction.targetId;
            return interaction.channel.messages.fetch(messageId);
        }

        export function replyOrFollowUp(interaction: BaseCommandInteraction | MessageComponentInteraction, content: string, ephemeral: boolean = false): Promise<void> {
            if (interaction.replied) {
                return interaction.followUp({
                    ephemeral,
                    content
                }) as unknown as Promise<void>;
            }
            if (interaction.deferred) {
                return interaction.editReply(content) as unknown as Promise<void>;
            }
            return interaction.reply({
                ephemeral,
                content
            });
        }

        export function getInteractionCaller(interaction: BaseCommandInteraction | MessageComponentInteraction): GuildMember | null {
            const {member} = interaction;
            if (member == null) {
                replyOrFollowUp(interaction, "Unable to extract member");
                throw new Error("Unable to extract member");
            }
            if (member instanceof GuildMember) {
                return member;
            }
            return null;
        }
    }

    export type EmojiInfo = {
        "buffer"?: Buffer,
        "url": string,
        "id": string
    };

    export type StickerInfo = EmojiInfo;

    export function getClient(): Client {
        return container.resolve(Client);
    }

    export async function getBot(guildId: string): Promise<GuildMember> {
        const guildManager = container.resolve(GuildManager);
        const guild = await guildManager.getGuild(guildId);
        return guild.me;
    }

    export async function getStickerInfo(sticker: Sticker, includeBuffer: boolean = true): Promise<StickerInfo> {
        const {url, format, id} = sticker;
        const retObj: StickerInfo = {
            url,
            id
        };
        if (!includeBuffer) {
            return retObj;
        }
        if (format === "LOTTIE") {
            retObj["buffer"] = Buffer.from(url, 'utf8');
        } else {
            try {
                retObj["buffer"] = await DiscordUtils.loadResourceFromURL(url);
            } catch {

            }
        }
        return retObj;
    }

    export async function getEmojiInfo(emojiId: string, includeBuffer: boolean = true): Promise<EmojiInfo> {
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
     * @param message
     */
    export async function getImageUrlsFromMessageOrReference(message: Message): Promise<Set<string>> {
        const messageAttachments = message.attachments;
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
        const messageContent = message.content;
        if (ObjectUtil.validString(messageContent)) {
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
        {
            const repliedMessageRef = message.reference;
            const urlMessageSet = new Set<string>();
            if (repliedMessageRef) {
                const repliedMessageID = repliedMessageRef.messageId;
                const repliedMessageObj = await message.channel.messages.fetch(repliedMessageID);
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
    }


    export type RoleChange = {
        permissions?: ObjectChange<Array<string>>
        nameChange?: ObjectChange<string>,
        colourChange?: ObjectChange<HexColorString>,
        iconChange?: ObjectChange<string>
    };

    export type ChannelUpdate = {
        name?: ObjectChange<string>,
        topic?: ObjectChange<string>,
        slowMode?: ObjectChange<number>,
        nsfw?: ObjectChange<boolean>,
        parent?: ObjectChange<CategoryChannel>
    };


    export type GuildUpdate = {
        banner?: ObjectChange<string>,
        rulesChannel?: ObjectChange<TextChannel>,
        splash?: ObjectChange<string>,
        description?: ObjectChange<string>,
        discoverySplash?: ObjectChange<string>,
        icon?: ObjectChange<string>,
        vanityURLCode?: ObjectChange<string>,
        name?: ObjectChange<string>,

    };

    export type ThreadUpdate = {
        archived?: ObjectChange<boolean>,
        type?: ObjectChange<"Public" | "Private" | null>
        locked?: ObjectChange<boolean>,
        name?: ObjectChange<string>,
        slowMode?: ObjectChange<number>,
        archiveDuration?: ObjectChange<ThreadAutoArchiveDuration | null>
    };

    export function getThreadChanges(oldThread: ThreadChannel, newThread: ThreadChannel): ThreadUpdate {
        const retObj: ThreadUpdate = {};
        const oldName = oldThread.name;
        const newName = newThread.name;
        if (oldName !== newName) {
            retObj["name"] = {
                before: oldName,
                after: newName
            };
        }

        const oldType = oldThread.type;
        const newType = newThread.type;
        if (oldType !== newType) {
            let oldParsed: "Public" | "Private" | null = null;
            let newParsed: "Public" | "Private" | null = null;
            if (ObjectUtil.validString(oldType)) {
                oldParsed = oldType === "GUILD_PRIVATE_THREAD" ? "Private" : "Public";
            }
            if (ObjectUtil.validString(newType)) {
                newParsed = newType === "GUILD_PRIVATE_THREAD" ? "Private" : "Public";
            }
            retObj["type"] = {
                before: oldParsed,
                after: newParsed
            };
        }

        const oldLocked = oldThread.locked;
        const newLocked = newThread.locked;
        if (oldLocked !== newLocked) {
            retObj["locked"] = {
                before: oldLocked,
                after: newLocked
            };
        }

        const oldArchived = oldThread.archived;
        const newArchived = newThread.archived;
        if (oldArchived !== newArchived) {
            retObj["archived"] = {
                before: oldArchived,
                after: newArchived
            };
        }

        const oldSlowMode = oldThread.rateLimitPerUser;
        const newSlowMode = newThread.rateLimitPerUser;
        if (oldSlowMode !== newSlowMode) {
            retObj["slowMode"] = {
                before: oldSlowMode,
                after: newSlowMode
            };
        }

        const oldArchiveDuration = oldThread.autoArchiveDuration;
        const newArchiveDuration = newThread.autoArchiveDuration;
        if (oldArchiveDuration !== newArchiveDuration) {
            retObj["archiveDuration"] = {
                before: oldArchiveDuration,
                after: newArchiveDuration
            };
        }
        return retObj;
    }

    export function getGuildUpdate(oldGuild: Guild, newGuild: Guild): GuildUpdate {
        const retObj: GuildUpdate = {};
        const oldName = oldGuild.name;
        const newName = newGuild.name;
        if (oldName !== newName) {
            retObj["name"] = {
                before: oldName,
                after: newName
            };
        }
        const oldBanner = oldGuild.banner;
        const newBanner = newGuild.banner;
        if (oldBanner !== newBanner) {
            retObj["banner"] = {
                before: sanitiseString(oldGuild.bannerURL({
                    size: 1024
                })),
                after: sanitiseString(newGuild.bannerURL({
                    size: 1024
                }))
            };
        }

        const oldRulesChannel = oldGuild.rulesChannelId;
        const newRulesChannel = newGuild.rulesChannelId;
        if (oldRulesChannel !== newRulesChannel) {
            retObj["rulesChannel"] = {
                before: oldGuild.rulesChannel,
                after: newGuild.rulesChannel
            };
        }

        const oldSplash = oldGuild.splash;
        const newSplash = newGuild.splash;
        if (oldSplash !== newSplash) {
            retObj["splash"] = {
                before: sanitiseString(newGuild.splashURL({
                    size: 1024
                })),
                after: sanitiseString(newGuild.splashURL({
                    size: 1024
                }))
            };
        }

        const oldDescription = oldGuild.description;
        const newDescription = newGuild.description;
        if (oldDescription !== newDescription) {
            retObj["description"] = {
                before: sanitiseString(oldDescription),
                after: sanitiseString(newDescription)
            };
        }

        const oldDiscoverySplash = oldGuild.discoverySplash;
        const newDiscoverySplash = newGuild.discoverySplash;
        if (oldDiscoverySplash !== newDiscoverySplash) {
            retObj["discoverySplash"] = {
                before: sanitiseString(oldGuild.discoverySplashURL({
                    size: 1024
                })),
                after: sanitiseString(newGuild.discoverySplashURL({
                    size: 1024
                }))
            };
        }

        const oldIcon = oldGuild.icon;
        const newIcon = newGuild.icon;
        if (oldIcon !== newIcon) {
            retObj["icon"] = {
                before: sanitiseString(oldGuild.iconURL({
                    size: 1024,
                    dynamic: true
                })),
                after: sanitiseString(newGuild.iconURL({
                    size: 1024,
                    dynamic: true
                }))
            };
        }

        const oldVanityUrl = oldGuild.vanityURLCode;
        const newVanityUrl = newGuild.vanityURLCode;
        if (oldVanityUrl !== newVanityUrl) {
            retObj["vanityURLCode"] = {
                before: sanitiseString(oldVanityUrl),
                after: sanitiseString(newVanityUrl)
            };
        }

        return retObj;
    }

    export function getChannelChanges(oldChannel: GuildChannel, newChannel: GuildChannel): ChannelUpdate {
        const retObj: ChannelUpdate = {};
        const oldName = oldChannel.name;
        const newName = newChannel.name;
        const isTextBasedChannel = oldChannel instanceof BaseGuildTextChannel && newChannel instanceof BaseGuildTextChannel;
        const isTextChannel = oldChannel instanceof TextChannel && newChannel instanceof TextChannel;
        if (oldName !== newName) {
            retObj["name"] = {
                before: oldName,
                after: newName
            };
        }
        if (isTextBasedChannel) {
            const oldTopic = oldChannel.topic;
            const newTopic = newChannel.topic;
            if (oldTopic !== newTopic) {
                retObj["topic"] = {
                    before: oldTopic,
                    after: newTopic
                };
            }
            if (isTextChannel) {
                const oldSlowMode = oldChannel.rateLimitPerUser;
                const newSlowMode = newChannel.rateLimitPerUser;
                if (oldSlowMode !== newSlowMode) {
                    retObj["slowMode"] = {
                        before: oldSlowMode,
                        after: newSlowMode
                    };
                }
            }
            const oldNsfw = oldChannel.nsfw;
            const newNsfw = newChannel.nsfw;
            if (oldNsfw !== newNsfw) {
                retObj["nsfw"] = {
                    before: oldNsfw,
                    after: newNsfw
                };
            }
        }
        const oldParent = oldChannel.parent;
        const newParent = newChannel.parent;
        if (oldParent == null && newParent !== null) {
            retObj["parent"] = {
                before: null,
                after: newParent
            };
        } else if (newParent == null && oldParent !== null) {
            retObj["parent"] = {
                before: oldParent,
                after: null
            };
        } else if (newParent && oldParent) {
            if (oldParent.id !== newParent.id) {
                retObj["parent"] = {
                    before: oldParent,
                    after: newParent
                };
            }
        }
        return retObj;
    }

    export function getRoleChanges(oldRole: Role, newRole: Role): RoleChange {
        const retObj: RoleChange = {};
        const iconUrlSettings: StaticImageURLOptions = {
            format: "png",
            size: 64
        };
        const added = oldRole.permissions.missing(newRole.permissions.bitfield);
        const removed = newRole.permissions.missing(oldRole.permissions.bitfield);

        if (added.length > 0 || removed.length > 0) {
            retObj["permissions"] = {
                before: removed,
                after: added
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

        const oldIcon = oldRole.iconURL(iconUrlSettings);
        const newIcon = newRole.iconURL(iconUrlSettings);
        if (oldIcon !== newIcon) {
            retObj["iconChange"] = {
                "before": sanitiseString(oldIcon),
                "after": sanitiseString(newIcon)
            };
        }
        return retObj;
    }

    function sanitiseString(str: string): string {
        return str ?? "None";
    }

    export async function loadResourceFromURL(url: string): Promise<Buffer> {
        const response = await fetch(url);
        const buffer = await response.buffer();
        if (response.status !== StatusCodes.OK) {
            throw new Error(buffer.toString("utf-8"));
        }
        return buffer;
    }

    export function getAccountAge(user: User | GuildMember, format: boolean = false): number | string {
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

    export function sanitiseTextForApiConsumption(message: Message | string): string {
        let retStr = typeof message === "string" ? message : message.content;
        retStr = `${retStr}`;
        retStr = stripAllEmojiFromText(retStr);
        retStr = stripUrls(retStr);
        return retStr;
    }

    export function stripAllEmojiFromText(message: Message | string): string {
        let retStr = typeof message === "string" ? message : message.content;
        retStr = `${retStr}`;
        if (!ObjectUtil.validString(retStr)) {
            return retStr;
        }
        const emojis = getEmojiFromMessage(retStr, true);
        for (const emoji of emojis) {
            retStr = retStr.replace(emoji, "");
        }
        return retStr.trim();
    }

    export function getEmojiFromMessage(message: Message | string, includeDefaultEmoji: boolean = true): string[] {
        const regex = new RegExp(/<(a?):(\w+):(\d+)>/, "g");
        const messageText = typeof message === "string" ? message : message.content;
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

    export async function postToLog(message: MessageEmbed[] | string, guildId: string, adminLog: boolean = false): Promise<Message | null> {
        let channel: BaseGuildTextChannel;
        const channelManager = container.resolve(ChannelManager);
        if (adminLog) {
            channel = await channelManager.getChannel(guildId, Channels.ADMIN_LOG_CHANNEL);
        } else {
            channel = await channelManager.getChannel(guildId, Channels.LOG_CHANNEL);
        }
        if (channel == null) {
            return null;
        }
        try {
            if (ArrayUtils.isValidArray(message)) {
                return channel.send({embeds: message});
            } else {
                return channel.send(message);
            }
        } catch (e) {
            console.warn(e.message);
        }
    }

    /**
     * Please note: if you are checking for an entry of one you are NOT listening to, you will need to check the creation date against user join date for ALL events
     * @param type
     * @param guild
     */
    export async function getAuditLogEntry(type: GuildAuditLogsAction, guild: Guild): Promise<GuildAuditLogsEntry<GuildAuditLogsAction>> {
        const fetchedAuditLog = await getAuditLogEntries(type, guild);
        if (!fetchedAuditLog) {
            return null;
        }
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
    export async function getAuditLogEntries(type: GuildAuditLogsAction, guild: Guild, limit: number = 1): Promise<GuildAuditLogs<GuildAuditLogsAction> | null> {
        const fetchObj: GuildAuditLogsFetchOptions<GuildAuditLogsAction> = {
            limit,
            type
        };
        try {
            return await guild.fetchAuditLogs(fetchObj);
        } catch {
            return null;
        }
    }

    export async function canUserPreformBlock(memberUsingBlock: GuildMember, memberAttemptingToBeBlocked: GuildMember): Promise<boolean> {
        const userToBlockHighestRole = memberAttemptingToBeBlocked.roles.highest;
        const userPreformingActionHighestRole = memberUsingBlock.roles.highest;
        return userPreformingActionHighestRole.position > userToBlockHighestRole.position;
    }

    export async function getAllClosableModules(guildId?: string): Promise<CloseOptionModel[]> {
        const builder = getRepository(CloseOptionModel)
            .createQueryBuilder("closeOptionModel")
            .distinct(true);
        if (ObjectUtil.validString(guildId)) {
            builder.where("closeOptionModel.guildId = :guildId", {
                guildId
            });
        }
        return await builder.getMany();
    }

    export function getCloseableModules(): CloseableModule<any>[] {
        return container.resolveAll<CloseableModule<any>>(Beans.ICloseableModuleToken);
    }

    export function getModule(moduleId: string): ICloseableModule<any> {
        const modules = DiscordUtils.getCloseableModules();
        for (const module of modules) {
            if (module.moduleId === moduleId) {
                return module;
            }
        }
        return null;
    }
}

export class ObjectUtil {

    public static delayFor(ms: number): Promise<void> {
        return new Promise(res => setTimeout(res, ms));
    }

    public static async search<T extends ISearchBase<SearchBase>>(interaction: AutocompleteInteraction, command: DApplicationCommand, contextHandler: T): Promise<void> {
        const result = await contextHandler.search(interaction);
        if (ArrayUtils.isValidArray(result)) {
            const responseMap = result.map(result => {
                return {
                    name: result.item.name,
                    value: result.item.name
                };
            });
            return interaction.respond(responseMap);
        }
        return interaction.respond([]);
    }

    public static getUrls(str: string): Set<string> {
        const regexp = /(http(s)?:\/\/.)(www\.)?[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)/gim;
        const matches = str.match(regexp);
        if (!ArrayUtils.isValidArray(matches)) {
            return new Set();
        }
        return new Set(matches);
    }

    public static guid(): string {
        function s4(): string {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }

    public static deepCompare(...objects: Record<string, any>[]): boolean {
        let i, l, leftChain, rightChain;

        function compare2Objects(x: any, y: any): boolean {
            let p;
            if (isNaN(x) && isNaN(y) && typeof x === 'number' && typeof y === 'number') {
                return true;
            }
            if (x === y) {
                return true;
            }
            if ((typeof x === 'function' && typeof y === 'function') ||
                (x instanceof Date && y instanceof Date) ||
                (x instanceof RegExp && y instanceof RegExp) ||
                (x instanceof String && y instanceof String) ||
                (x instanceof Number && y instanceof Number)) {
                return x.toString() === y.toString();
            }
            if (!(x instanceof Object && y instanceof Object)) {
                return false;
            }

            if (x.isPrototypeOf(y) || y.isPrototypeOf(x)) {
                return false;
            }

            if (x.constructor !== y.constructor) {
                return false;
            }

            if (x.prototype !== y.prototype) {
                return false;
            }

            if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1) {
                return false;
            }
            for (p in y) {
                if (y.hasOwnProperty(p) !== x.hasOwnProperty(p) || typeof y[p] !== typeof x[p]) {
                    return false;
                }
            }
            for (p in x) {
                if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                    return false;
                } else if (typeof y[p] !== typeof x[p]) {
                    return false;
                }

                switch (typeof (x[p])) {
                    case 'object':
                    case 'function':
                        leftChain.push(x);
                        rightChain.push(y);
                        if (!compare2Objects(x[p], y[p])) {
                            return false;
                        }
                        leftChain.pop();
                        rightChain.pop();
                        break;
                    default:
                        if (x[p] !== y[p]) {
                            return false;
                        }
                        break;
                }
            }

            return true;
        }

        if (arguments.length < 1) {
            return true;
        }

        for (i = 1, l = objects.length; i < l; i++) {
            leftChain = [];
            rightChain = [];
            if (!compare2Objects(objects[0], objects[i])) {
                return false;
            }
        }
        return true;
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

    public static isValidObject(obj: unknown): obj is Record<string, any> {
        return typeof obj === "object" && obj !== null && obj !== undefined && Object.keys(obj).length > 0;
    }

    public static isNumeric(n: string): boolean {
        // @ts-ignore
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    public static timeToHuman(value: number, timeUnit: TimeUtils.TIME_UNIT = TimeUtils.TIME_UNIT.milliseconds): string {
        let seconds: number;
        if (timeUnit === TimeUtils.TIME_UNIT.milliseconds) {
            seconds = Math.round(value / 1000);
        } else if (timeUnit !== TimeUtils.TIME_UNIT.seconds) {
            seconds = Math.round(TimeUtils.convertToMilli(value, timeUnit) / 1000);
        } else {
            seconds = value;
        }
        if (Number.isNaN(seconds)) {
            throw new Error("Unknown error");
        }
        const levels = [
            [Math.floor(seconds / 31536000), 'years'],
            [Math.floor((seconds % 31536000) / 86400), 'days'],
            [Math.floor(((seconds % 31536000) % 86400) / 3600), 'hours'],
            [Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), 'minutes'],
            [(((seconds % 31536000) % 86400) % 3600) % 60, 'seconds'],
        ];
        let returnText = '';

        for (let i = 0, max = levels.length; i < max; i++) {
            if (levels[i][0] === 0) {
                continue;
            }
            // @ts-ignore
            returnText += ` ${levels[i][0]} ${levels[i][0] === 1 ? levels[i][1].substr(0, levels[i][1].length - 1) : levels[i][1]}`;
        }
        return returnText.trim();
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
    public static loopBack<T>(e: any, aName: any, asValue: boolean = false): T {
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