import {Command, CommandMessage, Guard} from "@typeit/discord";
import {StringUtils} from "../../utils/Utils";
import {roleConstraints} from "../../guards/RoleConstraint";
import {Roles} from "../../enums/Roles";
import {TagModel} from "../../model/DB/Tag.model";
import {BaseDAO} from "../../DAO/BaseDAO";
import {BlockGuard} from "../../guards/BlockGuard";
import RolesEnum = Roles.RolesEnum;

export abstract class AddTag extends BaseDAO<TagModel>{

    @Command("addTag")
    @Guard(roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE), BlockGuard)
    private addTag(command: CommandMessage): Promise<TagModel> {
        let argumentArray = StringUtils.splitCommandLine(command.content);
        if (argumentArray.length !== 2) {
            command.reply("Invalid arguments, please supply tag; name, description");
            return;
        }
        let [_name, _description] = argumentArray;
        let _username = command.member.user.username;
        let tag = new TagModel({
            _name,
            _description,
            _username
        });
        return super.commitToDatabase(tag).then(tag => {
            command.reply(`Tag "${tag.name}" added.`);
            return tag;
        });
    }

}