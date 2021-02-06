import {Command, CommandMessage, Guard} from "@typeit/discord";
import {ObjectUtil, StringUtils} from "../../utils/Utils";
import {roleConstraints} from "../../guards/RoleConstraint";
import {Roles} from "../../enums/Roles";
import RolesEnum = Roles.RolesEnum;
import {TagModel} from "../../model/DB/Tag.model";
import {ValidationError, UniqueConstraintError} from 'sequelize';

export abstract class AddTag {

    @Command("addTag")
    @Guard(roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE))
    private addTag(command: CommandMessage): Promise<void | TagModel> {
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
        let errorStr = "";
        return tag.save({validate: true}).catch((validationError: ValidationError) => {
            let errors = validationError.errors;
            //TODO parse constraint errors, resulting error is shitty
            errorStr = errors.map(error => `${error.message}`).join("\n");
        }).catch((uniqueConstraintError: UniqueConstraintError) => {
            //TODO do this when i actually know what it means
            console.dir(`ERROR: ${uniqueConstraintError}`);
        }).catch(err => {
            // catch all other errors
        }).then(() => {
            ObjectUtil.validString(errorStr) ? command.reply(`An error occurred: ${errorStr}`) : command.reply(`Tag ${tag.name} added.`);
        });
    }

}