import {Command, CommandMessage, Guard} from "@typeit/discord";
import {roleConstraints} from "../../guards/RoleConstraint";
import {TagModel} from "../../model/DB/Tag.model";
import {Roles} from "../../enums/Roles";
import RolesEnum = Roles.RolesEnum;
import {StringUtils} from "../../utils/Utils";

export abstract class RemoveTag{

    @Command("removeTag")
    @Guard(roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE))
    private async removeTag(command: CommandMessage): Promise<TagModel> {
        let argumentArray = StringUtils.splitCommandLine(command.content);
        if (argumentArray.length !== 1) {
            command.reply("Invalid arguments, please supply tag name");
            return;
        }

        let [_name] = argumentArray;

        let rowCount = await TagModel.destroy({ where: { _name: _name } });
        if(rowCount != 1){
            command.reply('That tag did not exist.');
            return;
        }
        command.reply('Tag deleted.');
    }
}