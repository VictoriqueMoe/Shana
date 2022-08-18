import {singleton} from "tsyringe";
import {Typeings} from "../../Typeings.js";
import {
    BaseGuildTextChannel,
    ChannelType,
    Guild,
    GuildChannel,
    GuildMember,
    PartialGuildMember,
    Role,
    TextChannel,
    ThreadChannel
} from "discord.js";
import {DiscordUtils, ObjectUtil} from "../../../utils/Utils.js";
import {ImageURLOptions} from "@discordjs/rest";
import MemberUpdate = Typeings.MemberUpdate;
import RoleChange = Typeings.RoleChange;
import ChannelUpdate = Typeings.ChannelUpdate;
import ThreadUpdate = Typeings.ThreadUpdate;
import GuildUpdate = Typeings.GuildUpdate;
import sanitiseString = DiscordUtils.sanitiseString;

@singleton()
export class GuildInfoChangeManager {

    public getMemberChanges(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember): MemberUpdate {
        const retObj: MemberUpdate = {};
        const oldNick = oldMember.nickname;
        const newNick = newMember.nickname;
        if (oldNick !== newNick) {
            retObj["nickName"] = {
                before: oldNick,
                after: newNick
            };
        }

        const oldTimeout = oldMember.communicationDisabledUntilTimestamp;
        const newTimeout = newMember.communicationDisabledUntilTimestamp;
        if (oldTimeout !== newTimeout) {
            retObj["timeout"] = {
                before: oldTimeout,
                after: newTimeout
            };
        }

        return retObj;
    }

    public getThreadChanges(oldThread: ThreadChannel, newThread: ThreadChannel): ThreadUpdate {
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
                oldParsed = oldType === ChannelType.GuildPrivateThread ? "Private" : "Public";
            }
            if (ObjectUtil.validString(newType)) {
                newParsed = newType === ChannelType.GuildPrivateThread ? "Private" : "Public";
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

    public getGuildUpdate(oldGuild: Guild, newGuild: Guild): GuildUpdate {
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
                    size: 1024
                })),
                after: sanitiseString(newGuild.iconURL({
                    size: 1024
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

    public getChannelChanges(oldChannel: GuildChannel, newChannel: GuildChannel): ChannelUpdate {
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

    public getRoleChanges(oldRole: Role, newRole: Role): RoleChange {
        const retObj: RoleChange = {};
        const iconUrlSettings: ImageURLOptions = {
            extension: "png",
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

        const oldHoist = oldRole.hoist;
        const newHoist = newRole.hoist;
        if (oldHoist !== newHoist) {
            retObj["hoist"] = {
                "before": oldHoist,
                "after": newHoist
            };
        }

        return retObj;
    }
}
