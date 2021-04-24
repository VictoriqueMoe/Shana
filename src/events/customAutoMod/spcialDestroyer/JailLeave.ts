import {ArgsOf, Client, On} from "@typeit/discord";
import {GuildMember, Role} from "discord.js";
import {BaseDAO, UniqueViolationError} from "../../../DAO/BaseDAO";
import {RolePersistenceModel} from "../../../model/DB/autoMod/impl/RolePersistence.model";
import {AbstractRoleApplier} from "../RoleApplier/AbstractRoleApplier";
import {GuildUtils} from "../../../utils/Utils";

export abstract class JailLeave extends BaseDAO<RolePersistenceModel> {


    @On("guildMemberRemove")
    private async specialLeave([member]: ArgsOf<"guildMemberRemove">, client: Client): Promise<void> {
        const jailRole = await GuildUtils.RoleUtils.getJailRole(member.guild.id);
        if (!jailRole) {
            return;
        }
        const model = await new SpecialProxy().roleLeaves(jailRole, member as GuildMember, RolePersistenceModel);
        if (model) {
            try {
                await super.commitToDatabase(model, {}, true);
            } catch (e) {
                if (e instanceof UniqueViolationError) {
                    return;
                }
            }
        }
    }
}

class SpecialProxy extends AbstractRoleApplier {
    public async roleLeaves(role: Role, member: GuildMember, model: typeof RolePersistenceModel): Promise<RolePersistenceModel> {
        return super.roleLeaves(role, member, model);
    }
}