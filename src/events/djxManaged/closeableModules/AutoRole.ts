import {ArgsOf, Client, Discord, On} from "discordx";
import * as schedule from "node-schedule";
import {Guild, GuildMember} from "discord.js";
import {RolePersistenceModel} from "../../../model/DB/entities/autoMod/impl/RolePersistence.model.js";
import {AutoRoleSettings} from "../../../model/closeableModules/settings/AutoRoleSettings.js";
import {injectable} from "tsyringe";
import {TimedSet} from "@discordx/utilities";
import logger from "../../../utils/LoggerFactory.js";
import {DiscordUtils, ObjectUtil} from "../../../utils/Utils.js";
import {RoleApplier} from "../../../model/impl/RoleApplier.js";
import {PostConstruct} from "../../../model/framework/decorators/PostConstruct.js";
import {EventDeletedListener} from "../eventDispatcher/EventDeletedListener.js";
import {LogChannelManager} from "../../../model/framework/manager/LogChannelManager.js";
import {RoleManager} from "../../../model/framework/manager/RoleManager.js";
import {CloseableModule} from "../../../model/closeableModules/impl/CloseableModule.js";
import TIME_UNIT from "../../../enums/TIME_UNIT.js";
import {BannedWordFilter} from "../../../model/closeableModules/subModules/autoMod/impl/BannedWordFilter.js";

class JoinEntry {
    public constructor(public joinCount: number) {
    }

    public increment(): void {
        this.joinCount++;
    }
}

@Discord()
@injectable()
export class AutoRole extends CloseableModule<AutoRoleSettings> {

    private static readonly _joinTimedSet = new TimedSet<JoinEntry>(10000);

    public constructor(private _roleApplier: RoleApplier,
                       private _logManager: LogChannelManager,
                       private _roleManager: RoleManager) {
        super();
    }

    public get moduleId(): string {
        return "AutoRole";
    }

    public async applyRole(member: GuildMember, guildId: string, isTimed = false): Promise<void> {
        if (EventDeletedListener.isMemberRemoved(member)) {
            return;
        }
        const settings = await this.getSettings(guildId, isTimed);
        if (await this.doPanic(member, settings)) {
            return;
        }
        const filter = this._subModuleManager.getSubModule(BannedWordFilter);
        const isWordBanned = await filter.isWordBanned(guildId, member.displayName);
        if (filter.isActive && isWordBanned) {
            await DiscordUtils.sendToJail(member, "You have been placed here because your display name violates our rules, Please change it");
            return;
        }

        const persistedRole = await this.ds.getRepository(RolePersistenceModel).findOne({
            where: {
                userId: member.id,
                guildId
            }
        });
        const guild = await DiscordUtils.getGuild(guildId);
        const bot = guild.members.me;
        const botUsername = bot.user.username;
        try {
            if (persistedRole) {
                const rolePersisted = await guild.roles.fetch(persistedRole.roleId);
                const jailRole = await this._roleManager.getJailRole(guildId);
                if (jailRole && rolePersisted.id === jailRole.id) {
                    if (settings.autoJail) {
                        this._logManager.postToLog(`Member <@${member.user.id}> has rejoined after leaving in jail and has been re-jailed`, member.guild.id);
                        await this._roleApplier.applyRole(rolePersisted, member, `added via ${botUsername}`);
                    }
                } else {
                    await this._roleApplier.applyRole(rolePersisted, member, `added via ${botUsername}`);
                }
                return;
            }
        } catch {
        }
        const autoRoleIds = settings.role;
        if (ObjectUtil.isValidArray(autoRoleIds)) {
            for (const autoRoleFromSetting of autoRoleIds) {
                const autoRole = guild.roles.cache.get(autoRoleFromSetting);
                if (autoRole) {
                    try {
                        await this._roleApplier.applyRole(autoRole, member, `added via ${botUsername}`);
                    } catch {
                    }
                }
            }
        }
    }

    @PostConstruct
    public async applyEmptyRoles(clinet: Client): Promise<Map<Guild, string[]>> {
        const retMap: Map<Guild, string[]> = new Map();
        for (const [guildId, guild] of clinet.guilds.cache) {
            const enabled = await this.isEnabled(guildId);
            if (enabled) {
                const membersApplied: string[] = [];
                const noRoles = await this._roleManager.getMembersWithNoRoles(guildId);
                for (const noRole of noRoles) {
                    logger.info(`setting roles for ${noRole.user.tag} as they have no roles`);
                    membersApplied.push(noRole.user.tag);
                    await this.applyRole(noRole, guildId);
                }
                retMap.set(guild, membersApplied);
            }
        }
        return retMap;
    }

    private async doPanic(member: GuildMember, settings: AutoRoleSettings): Promise<boolean> {
        if (settings.panicMode) {
            try {
                await this._roleManager.applyPanicModeRole(member);
                return true;
            } catch {
            }
            return false;
        }
    }

    public setDefaults(guildId?: string): Promise<void> {
        return Promise.resolve(undefined);
    }

    @On({
        event: "guildMemberAdd"
    })
    private async memberJoins([member]: ArgsOf<"guildMemberAdd">): Promise<void> {
        const guildId = member.guild.id;
        if (!await this.isEnabled(guildId)) {
            return;
        }
        const settings = await this.getSettings(guildId);
        if (settings.massJoinProtection > 0 && !settings.panicMode) {
            if (AutoRole._joinTimedSet.isEmpty()) {
                const entry = new JoinEntry(1);
                AutoRole._joinTimedSet.add(entry);
            } else {
                const entry: JoinEntry = AutoRole._joinTimedSet.rawSet.values().next().value;
                AutoRole._joinTimedSet.refresh(entry);
                entry.increment();
                if (entry.joinCount > settings.massJoinProtection) {
                    this._logManager.postToLog(`More than ${settings.massJoinProtection} has joined this server in 10 seconds, panic mode is enabled`, guildId);
                    await this.saveSettings(guildId, {
                        panicMode: true
                    }, true);
                    settings.panicMode = true;
                }
            }
        }
        if (await this.doPanic(member, settings)) {
            return;
        }
        if (settings.minAccountAge > 0) {
            const convertedTime = ObjectUtil.convertToMilli(settings.minAccountAge, TIME_UNIT.days);
            const memberCreated = member.user.createdAt.getTime();
            const now = Date.now();
            const accountAge = now - memberCreated;
            if (accountAge < convertedTime) {
                const accountAgeHuman = ObjectUtil.timeToHuman(convertedTime);
                try {
                    await this._roleManager.applyYoungAccountConstraint(member, accountAgeHuman);
                } catch {
                }
                return;
            }
        }
        if (settings.autoRoleTimeout > 0) {
            const now = Date.now();
            const timeout = settings.autoRoleTimeout;
            const toAddRole = now + timeout;
            const d = new Date(toAddRole);
            schedule.scheduleJob(`enable ${member.user.tag}`, d, async () => {
                await this.applyRole(member, guildId, true);
            });
        } else {
            await this.applyRole(member, guildId, false);
        }
    }

    @On({
        event: "guildMemberRemove"
    })
    private async jailRoleLeaves([member]: ArgsOf<"guildMemberRemove">): Promise<void> {
        if (!await this.isEnabled(member.guild.id)) {
            return;
        }
        const jailRole = await this._roleManager.getJailRole(member.guild.id);
        if (!jailRole) {
            return;
        }
        const model = await this._roleApplier.roleLeaves(jailRole, member as GuildMember, RolePersistenceModel);
        if (model) {
            await this.ds.getRepository(RolePersistenceModel).save(model);
        }
    }
}
