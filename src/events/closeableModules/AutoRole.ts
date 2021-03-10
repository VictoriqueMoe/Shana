import {CloseableModule} from "../../model/closeableModules/impl/CloseableModule";
import {ArgsOf, Client, Guard, On} from "@typeit/discord";
import {EnabledGuard} from "../../guards/EnabledGuard";
import {CloseOptionModel} from "../../model/DB/autoMod/impl/CloseOption.model";
import {Roles} from "../../enums/Roles";
import * as schedule from "node-schedule";
import {AbstractRoleApplier} from "../customAutoMod/RoleApplier/AbstractRoleApplier";
import {GuildMember} from "discord.js";
import {RolePersistenceModel} from "../../model/DB/autoMod/impl/RolePersistence.model";
import {DiscordUtils, EnumEx, ObjectUtil} from "../../utils/Utils";
import RolesEnum = Roles.RolesEnum;

class RoleProxy<T extends RolesEnum> extends AbstractRoleApplier<T> {
    public async applyRole(role: T, member: GuildMember, reason?: string): Promise<void> {
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
            const persistedRole = await RolePersistenceModel.findOne({
                where: {
                    "userId": member.id
                }
            });
            try {
                if (persistedRole) {
                    const rolePersisted = EnumEx.loopBack(RolesEnum, persistedRole.roleId, true) as unknown as RolesEnum;
                    await this._roleApplier.applyRole(rolePersisted, member, "added via VicBot");
                    if (rolePersisted === RolesEnum.SPECIAL) {
                        DiscordUtils.postToLog(`Member <@${member.user.id}> has rejoined after leaving as special (possible special evasion) \n <@697417252320051291> <@593208170869162031>`);
                    } else if (rolePersisted === RolesEnum.MUTED) {
                        DiscordUtils.postToLog(`Member <@${member.user.id}> has rejoined after leaving as muted and because of this, has been re-muted.`);
                    }
                    return;
                }
                await this._roleApplier.applyRole(RolesEnum.HEADCRABS, member, "added via VicBot");
            } catch {
                await this._roleApplier.applyRole(RolesEnum.HEADCRABS, member, "added via VicBot");
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