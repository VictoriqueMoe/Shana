import {ArgsOf, Client, Discord, On} from "discordx";
import {GuildUtils} from "../../../utils/Utils";
import {BannedWordFilter} from "../../../model/closeableModules/subModules/dynoAutoMod/impl/BannedWordFilter";
import {RolePersistenceModel} from "../../../model/DB/autoMod/impl/RolePersistence.model";
import {BaseDAO} from "../../../DAO/BaseDAO";
import {MemberRoleChange} from "../../../modules/automod/MemberRoleChange";
import {MuteManager} from "../../../model/guild/manager/MuteManager";
import {container, injectable} from "tsyringe";
import {RoleApplier} from "./RoleApplier";

@Discord()
@injectable()
export class MemberListeners extends BaseDAO<RolePersistenceModel> {

    public constructor(private _roleApplier: RoleApplier, private _muteManager: MuteManager) {
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
    public async muteRoleListener([oldUser, newUser]: ArgsOf<"guildMemberUpdate">, client: Client): Promise<void> {
        const mutedRole = await GuildUtils.RoleUtils.getMuteRole(newUser.guild.id);
        if (!mutedRole) {
            return;
        }
        const didRemove = await this._roleApplier.onChange(mutedRole, new MemberRoleChange(oldUser, newUser), RolePersistenceModel);
        // mute was removed, so clear the timeout and mute Model if one exists
        if (didRemove) {
            try {
                await this._muteManager.doRemove(newUser.id, newUser.guild.id, mutedRole.id, true);
            } catch {
            }
        }
    }

    @On("guildMemberUpdate")
    private async memeberDetailsChanged([oldUser, newUser]: ArgsOf<"guildMemberUpdate">, client: Client): Promise<void> {
        const filter: BannedWordFilter = container.resolve(BannedWordFilter);
        if (!filter.isActive) {
            return;
        }
        if (oldUser.nickname !== newUser.nickname) {
            await filter.checkUsername(newUser);
        }
    }
}