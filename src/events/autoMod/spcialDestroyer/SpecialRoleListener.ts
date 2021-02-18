import {ArgsOf, Client, On} from "@typeit/discord";
import {Roles} from "../../../enums/Roles";
import {AbstractRoleApplier} from "../RoleApplier/AbstractRoleApplier";
import {UserChange} from "../../../modules/automod/UserChange";
import {RolePersistenceModel} from "../../../model/DB/autoMod/impl/RolePersistence.model";
import RolesEnum = Roles.RolesEnum;

export abstract class specialRoleListener extends AbstractRoleApplier<RolesEnum.SPECIAL> {

    @On("guildMemberUpdate")
    public async roleListener([oldUser, newUser]: ArgsOf<"guildMemberUpdate">, client: Client): Promise<void> {
        await super.onChange(RolesEnum.SPECIAL, new UserChange(oldUser, newUser), RolePersistenceModel);
    }
}