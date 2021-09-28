import {ArgsOf, Client, Discord, On} from "discordx";
import {GuildUtils} from "../../../utils/Utils";
import {BannedWordFilter} from "../../../model/closeableModules/subModules/dynoAutoMod/impl/BannedWordFilter";
import {RolePersistenceModel} from "../../../model/DB/autoMod/impl/RolePersistence.model";
import {BaseDAO} from "../../../DAO/BaseDAO";
import {GuildMember, Role} from "discord.js";
import {AbstractRoleApplier} from "./AbstractRoleApplier";
import {MemberRoleChange} from "../../../modules/automod/MemberRoleChange";
import {MuteSingleton} from "../../../commands/customAutoMod/userBlock/MuteSingleton";
import {container} from "tsyringe";

@Discord()
export class MemberListeners extends BaseDAO<RolePersistenceModel> {

    @On("guildMemberUpdate")
    public async jailRoleListener([oldUser, newUser]: ArgsOf<"guildMemberUpdate">, client: Client): Promise<void> {
        const jailRole = await GuildUtils.RoleUtils.getJailRole(newUser.guild.id);
        if (jailRole) {
            await new SpecialProxy().onChange(jailRole, new MemberRoleChange(oldUser, newUser), RolePersistenceModel);
        }
    }

    @On("guildMemberUpdate")
    public async muteRoleListener([oldUser, newUser]: ArgsOf<"guildMemberUpdate">, client: Client): Promise<void> {
        const mutedRole = await GuildUtils.RoleUtils.getMuteRole(newUser.guild.id);
        if (!mutedRole) {
            return;
        }
        const didRemove = await new SpecialProxy().onChange(mutedRole, new MemberRoleChange(oldUser, newUser), RolePersistenceModel);
        // mute was removed, so clear the timeout and mute Model if one exists
        if (didRemove) {
            try {
                const muteSingleton = container.resolve(MuteSingleton);
                await muteSingleton.doRemove(newUser.id, newUser.guild.id, mutedRole.id, true);
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

class SpecialProxy extends AbstractRoleApplier {
    public override async roleLeaves(role: Role, member: GuildMember, model: typeof RolePersistenceModel): Promise<RolePersistenceModel> {
        return super.roleLeaves(role, member, model);
    }

    public override async onChange(role: Role, change: MemberRoleChange, model: typeof RolePersistenceModel): Promise<boolean> {
        return super.onChange(role, change, model);
    }
}