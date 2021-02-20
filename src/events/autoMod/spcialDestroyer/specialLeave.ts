import {ArgsOf, Client, On} from "@typeit/discord";
import {GuildMember} from "discord.js";
import {Roles} from "../../../enums/Roles";
import {BaseDAO, UniqueViolationError} from "../../../DAO/BaseDAO";
import {RolePersistenceModel} from "../../../model/DB/autoMod/impl/RolePersistence.model";
import {AbstractRoleApplier} from "../RoleApplier/AbstractRoleApplier";
import RolesEnum = Roles.RolesEnum;

export abstract class SpecialLeave extends BaseDAO<RolePersistenceModel> {


    @On("guildMemberRemove")
    private async specialLeave([member]: ArgsOf<"guildMemberRemove">, client: Client): Promise<void> {
        const model = await new SpecialProxy().roleLeaves(RolesEnum.SPECIAL, member as GuildMember, RolePersistenceModel);
        if (model) {
            try {
                await super.commitToDatabase(model);
            } catch (e) {
                if (e instanceof UniqueViolationError) {
                    return;
                }
            }
        }
    }
}

class SpecialProxy extends AbstractRoleApplier<RolesEnum.SPECIAL> {
    public async roleLeaves(role, member: GuildMember, model: typeof RolePersistenceModel): Promise<RolePersistenceModel> {
        return super.roleLeaves(RolesEnum.SPECIAL, member, model);
    }
}