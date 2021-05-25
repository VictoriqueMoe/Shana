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

class RoleProxy extends AbstractRoleApplier {
    public async applyRole(role: Role, member: GuildMember, reason?: string): Promise<void> {
        return super.applyRole(role, member, reason);
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
        const seventySeconds = 70000;
        const toAddRole = now + seventySeconds;
        const d = new Date(toAddRole);
        //TODO use scheduler
        schedule.scheduleJob(`enable ${member.user.username}`, d, async () => {
            const guildId = member.guild.id;
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


    public get moduleId(): string {
        return "AutoRole";
    }

    public get isDynoReplacement(): boolean {
        return true;
    }

}