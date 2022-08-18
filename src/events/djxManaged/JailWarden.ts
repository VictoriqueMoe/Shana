import {RolePersistenceModel} from "../../model/DB/entities/autoMod/impl/RolePersistence.model.js";
import {injectable} from "tsyringe";
import {ArgsOf, Discord, On} from "discordx";
import {MemberRoleChange} from "../../model/impl/MemberRoleChange.js";
import {BannedWordFilter} from "../../model/closeableModules/subModules/autoMod/impl/BannedWordFilter.js";
import {RoleApplier} from "../../model/impl/RoleApplier.js";
import {RoleManager} from "../../model/framework/manager/RoleManager.js";
import {DiscordUtils} from "../../utils/Utils.js";
import {SubModuleManager} from "../../model/framework/manager/SubModuleManager.js";

@Discord()
@injectable()
export class JailWarden {

    public constructor(private _roleApplier: RoleApplier,
                       private _roleManager: RoleManager,
                       private _subModuleManager: SubModuleManager) {
    }

    @On({
        event: "guildMemberUpdate"
    })
    public async jailRoleListener([oldUser, newUser]: ArgsOf<"guildMemberUpdate">): Promise<void> {
        const jailRole = await this._roleManager.getJailRole(newUser.guild.id);
        if (jailRole) {
            await this._roleApplier.onChange(jailRole, new MemberRoleChange(oldUser, newUser), RolePersistenceModel);
        }
    }

    @On({
        event: "guildMemberUpdate"
    })
    private async memeberDetailsChanged([oldUser, newUser]: ArgsOf<"guildMemberUpdate">): Promise<void> {
        const filter: BannedWordFilter = this._subModuleManager.getSubModule<BannedWordFilter>("Banned Word Filter");
        if (!(await filter.isActive(newUser.guild.id))) {
            return;
        }
        if (oldUser.nickname !== newUser.nickname) {
            if (await filter.isWordBanned(newUser.nickname, newUser.guild.id)) {
                await DiscordUtils.sendToJail(newUser, "You have been placed here because your display name violates our rules, Please change it");
                return;
            }
        }
    }
}
