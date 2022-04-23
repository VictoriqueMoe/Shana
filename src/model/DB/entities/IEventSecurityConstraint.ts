import type {GuildChannel, Role} from "discord.js";

/**
 * Any model implementing this interface will enable the event that fires this module to be constrained to channels and roles
 */
export interface IEventSecurityConstraint {
    /**
     * Adding allowed Channels will constrain this bot to ONLY trigger posts in these channels, making "ignoredChannels" redundant
     */
    allowedChannels: GuildChannel[];

    /**
     * Adding ignored Channels will constrain this bot to NOT trigger posts in these channels, making "allowedChannels" redundant
     */
    ignoredChannels: GuildChannel[];

    /**
     * Adding allowed roles will constrain this bot to ONLY trigger posts by members who have these roles, making "ignoredROles" redundant
     */
    allowedRoles: Role[];

    /**
     * Adding ignored roles will constrain this bot to NOT trigger posts by members who have these roles, making "allowedRoles" redundant
     */
    ignoredRoles: Role[];
}