import {Command, CommandMessage, Guard} from "@typeit/discord";
import {roleConstraints} from "../../guards/RoleConstraint";
import {TagModel} from "../../dao/Tag.model";
import {Roles} from "../../enums/Roles";
import RolesEnum = Roles.RolesEnum;
import {StringUtils} from "../../utils/Utils";

export abstract class UpdateTag {
    @Command("updateTag")
    @Guard(roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE))
    private async updateTag(command: CommandMessage): Promise<TagModel | null> {
        let argumentArray = StringUtils.splitCommandLine(command.content);
        if (argumentArray.length !== 2) {
            command.reply("Invalid arguments, please supply tag name to update and the new description");
            return;
        }
        let [_name, _description] = argumentArray;
        let numOfRowsUpdated = 0;
        try {
            let rowsUpdated = await TagModel.update({
                _name,
                _description
            }, {
                where: {
                    _name: _name
                }
            });
            numOfRowsUpdated = rowsUpdated[0];
        } catch (e) {
            //TODO make this method abstract, so all DAO executions go trough the same error handler
            command.reply(`Error occurred: ${e.message}`);
            return;
        }
        if (numOfRowsUpdated > 0) {
            command.reply(`Tag "${_name}" was edited.`);
        } else {
            command.reply(`Could not find a tag with name "${_name}".`);
        }
    }
}