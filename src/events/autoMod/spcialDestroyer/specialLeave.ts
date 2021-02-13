import {ArgsOf, Client, On} from "@typeit/discord";
import {GuildMember} from "discord.js";
import {Roles} from "../../../enums/Roles";
import {BaseDAO} from "../../../DAO/BaseDAO";
import {RolePersistenceModel} from "../../../model/DB/autoMod/RolePersistence.model";
import {AbstractRoleApplier} from "../RoleApplier/AbstractRoleApplier";
import RolesEnum = Roles.RolesEnum;

export abstract class SpecialLeave extends BaseDAO<RolePersistenceModel> {


    @On("guildMemberRemove")
    private async specialLeave([member]: ArgsOf<"guildMemberRemove">, client: Client): Promise<void> {
        let model = await new SpecialProxy().roleLeaves(RolesEnum.SPECIAL, member as GuildMember, RolePersistenceModel);
        if (model) {
            super.commitToDatabase(model);
        }
    }
}

class SpecialProxy extends AbstractRoleApplier<RolesEnum.SPECIAL> {
    public async roleLeaves(role, member: GuildMember, model: typeof RolePersistenceModel): Promise<RolePersistenceModel> {
        return super.roleLeaves(RolesEnum.SPECIAL, member, model);
    }
}