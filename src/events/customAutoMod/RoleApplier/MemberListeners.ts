import {ArgsOf, Client, Discord, On} from "discordx";
import {GuildUtils} from "../../../utils/Utils";
import {BannedWordFilter} from "../../../model/closeableModules/subModules/dynoAutoMod/impl/BannedWordFilter";
import {RolePersistenceModel} from "../../../model/DB/entities/autoMod/impl/RolePersistence.model";
import {BaseDAO} from "../../../DAO/BaseDAO";
import {MemberRoleChange} from "../../../model/Impl/MemberRoleChange";
import {MuteManager} from "../../../model/framework/manager/MuteManager";
import {injectable} from "tsyringe";
import {RoleApplier} from "./RoleApplier";
import {SubModuleManager} from "../../../model/closeableModules/manager/SubModuleManager";

@Discord()
@injectable()
export class MemberListeners extends BaseDAO<RolePersistenceModel> {

    public constructor(private _roleApplier: RoleApplier, private _muteManager: MuteManager, private _subModuleManager: SubModuleManager) {
        super();
    }

    @On("guildMemberUpdate")
    public async jailRoleListener([oldUser, newUser]: ArgsOf<"guildMemberUpdate">, client: Client): Promise<void> {
        const jailRole = await GuildUtils.RoleUtils.getJailRole(newUser.guild.id);
        if (jailRole) {
            await this._roleApplier.onChange(jailRole, new MemberRoleChange(oldUser, newUser), RolePersistenceModel);
        }
    }

    @On("guildMemberUpdate")
    private async memeberDetailsChanged([oldUser, newUser]: ArgsOf<"guildMemberUpdate">, client: Client): Promise<void> {
        const filter: BannedWordFilter = this._subModuleManager.getSubModule(BannedWordFilter);
        if (!filter.isActive) {
            return;
        }
        if (oldUser.nickname !== newUser.nickname) {
            if (filter.isWordBanned(newUser.nickname)) {
                await GuildUtils.sendToJail(newUser, "You have been placed here because your display name violates our rules, Please change it");
                return;
            }
        }
    }
}
