import {singleton} from "tsyringe";
import type {Guild, GuildMember, Role} from "discord.js";
import {DiscordUtils, ObjectUtil} from "../../../utils/Utils.js";
import SETTINGS from "../../../enums/SETTINGS.js";
import {SettingsManager} from "./SettingsManager.js";
import {LogChannelManager} from "./LogChannelManager.js";
import {ChannelManager} from "./ChannelManager.js";
import Channels from "../../../enums/Channels.js";

@singleton()
export class RoleManager {
    public constructor(private _settingsManager: SettingsManager,
                       private _logChannelManager: LogChannelManager,
                       private _channelManager: ChannelManager) {
    }

    public getJailRole(guildId: string): Promise<Role | null> {
        return this.getRole(guildId, SETTINGS.JAIL_ROLE);
    }

    public getYoungAccountRole(guildId: string): Promise<Role | null> {
        return this.getRole(guildId, SETTINGS.YOUNG_ACCOUNT_ROLE);
    }

    public async getRole(guildId: string, setting: SETTINGS): Promise<Role | null> {
        const role = await this._settingsManager.getSetting(setting, guildId);
        if (!ObjectUtil.validString(role)) {
            return null;
        }
        let roleResolved: Role = null;
        try {
            const guild = await DiscordUtils.getGuild(guildId);
            roleResolved = await guild.roles.fetch(role);
        } catch {
            return null;
        }
        return roleResolved;
    }

    public async getMembersWithNoRoles(guildId: string): Promise<GuildMember[]> {
        const guild = await DiscordUtils.getGuild(guildId);
        const members = await guild.members.fetch({
            force: true
        });
        return [...members.values()].filter(member => {
            for (const [roleId] of member.roles.cache) {
                if (roleId !== guild.roles.everyone.id) {
                    return false;
                }
            }
            return true;
        });
    }

    public async applyPanicModeRole(member: GuildMember): Promise<void> {
        const guildId = member.guild.id;
        const guild = await DiscordUtils.getGuild(guildId);
        return this.applyUnverified(member, `Hello, we have detected unusual mass joins on our server recently, we must verify your account before you can access the ${guild.name} Discord Server`, guild, true);
    }

    public async applyYoungAccountConstraint(member: GuildMember, timeout: string): Promise<void> {
        const guildId = member.guild.id;
        const guild = await DiscordUtils.getGuild(guildId);
        return this.applyUnverified(member, `Hello, as your Discord account is less than ${timeout} old and because of recent scams, we must verify your account before you can access the ${guild.name} Discord Server`, guild);
    }

    public async applyUnverified(member: GuildMember, dmStr: string, guild: Guild, panicMode = false): Promise<void> {
        if (DiscordUtils.isMemberAdmin(member)) {
            return;
        }
        const guildId = guild.id;
        const unverifiedRole = await this.getYoungAccountRole(guildId);
        if (!unverifiedRole) {
            throw new Error("Unable to find Unverified account role");
        }
        await member.roles.set([unverifiedRole]);
        if (!panicMode) {
            this._logChannelManager.postToLog(`Member <@${member.id}> ${member.user.tag} has been applied the ${unverifiedRole.name} role`, guildId);
        }

        let message = dmStr;
        const jailChannel = await this._channelManager.getChannel(guild.id, Channels.JAIL_CHANNEL);
        if (jailChannel) {
            message += `\nPlease post in the #${jailChannel.name} channel for faster verification process`;
        }
        await member.send(message);
    }
}
