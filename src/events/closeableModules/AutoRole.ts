import {CloseableModule} from "../../model/closeableModules/impl/CloseableModule";
import {ArgsOf, Client, Guard, On} from "@typeit/discord";
import {EnabledGuard} from "../../guards/EnabledGuard";
import {CloseOptionModel} from "../../model/DB/autoMod/impl/CloseOption.model";
import * as schedule from "node-schedule";
import {AbstractRoleApplier} from "../customAutoMod/RoleApplier/AbstractRoleApplier";
import {GuildMember, Role} from "discord.js";
import {RolePersistenceModel} from "../../model/DB/autoMod/impl/RolePersistence.model";
import {DiscordUtils, GuildUtils, ObjectUtil} from "../../utils/Utils";
import {GuildManager} from "../../model/guild/manager/GuildManager";
import {UniqueViolationError} from "../../DAO/BaseDAO";
import {BannedWordFilter} from "../../model/closeableModules/subModules/dynoAutoMod/impl/BannedWordFilter";

class RoleProxy extends AbstractRoleApplier {
    public async applyRole(role: Role, member: GuildMember, reason?: string): Promise<void> {
        return super.applyRole(role, member, reason);
    }

    public async roleLeaves(role: Role, member: GuildMember, model: typeof RolePersistenceModel): Promise<RolePersistenceModel> {
        return super.roleLeaves(role, member, model);
    }
}

export class AutoRole extends CloseableModule {

    private _roleApplier = new RoleProxy();

    private static _uid = ObjectUtil.guid();

    constructor() {
        super(CloseOptionModel, AutoRole._uid);
    }

    @On("guildMemberAdd")
    @Guard(EnabledGuard("AutoRole"))
    private async memberJoins([member]: ArgsOf<"guildMemberAdd">, client: Client): Promise<void> {
        const now = Date.now();
        const oneMin = 60000;
        const toAddRole = now + oneMin;
        const d = new Date(toAddRole);
        //TODO use scheduler
        schedule.scheduleJob(`enable ${member.user.username}`, d, async () => {
            const guildId = member.guild.id;
            const module = DiscordUtils.getModule("DynoAutoMod");
            const filter: BannedWordFilter = module.submodules.find(m => m instanceof BannedWordFilter) as BannedWordFilter;
            if (filter.isActive && await filter.checkUsername(member)) {
                return;
            }

            const persistedRole = await RolePersistenceModel.findOne({
                where: {
                    userId: member.id,
                    guildId
                }
            });
            try {
                if (persistedRole) {
                    const guild = await GuildManager.instance.getGuild(guildId);
                    const rolePersisted = await guild.roles.fetch(persistedRole.roleId);
                    await this._roleApplier.applyRole(rolePersisted, member, "added via VicBot");
                    const jailRole = await GuildUtils.RoleUtils.getJailRole(guildId);
                    const muteRole = await GuildUtils.RoleUtils.getMuteRole(guildId);
                    if (jailRole && rolePersisted.id === jailRole.id) {
                        DiscordUtils.postToLog(`Member <@${member.user.id}> has rejoined after leaving in jail and has be re-jailed`, member.guild.id);
                    } else if (muteRole && rolePersisted.id === muteRole.id) {
                        DiscordUtils.postToLog(`Member <@${member.user.id}> has rejoined after leaving as muted and has been re-muted.`, member.guild.id);
                    }
                    return;
                }
            } catch {
            }
            const autoRole = await GuildUtils.RoleUtils.getAutoRole(guildId);
            if (autoRole) {
                await this._roleApplier.applyRole(autoRole, member, "added via VicBot");
            }
        });
    }

    @On("guildMemberRemove")
    private async specialLeave([member]: ArgsOf<"guildMemberRemove">, client: Client): Promise<void> {
        if (!this.isEnabled) {
            return;
        }
        const jailRole = await GuildUtils.RoleUtils.getJailRole(member.guild.id);
        if (!jailRole) {
            return;
        }
        const model = await this._roleApplier.roleLeaves(jailRole, member as GuildMember, RolePersistenceModel);
        if (model) {
            try {
                // @ts-ignore
                await super.commitToDatabase(model, {}, true);
            } catch (e) {
                if (e instanceof UniqueViolationError) {
                    return;
                }
            }
        }
    }


    public get moduleId(): string {
        return "AutoRole";
    }

    public get isDynoReplacement(): boolean {
        return true;
    }

}