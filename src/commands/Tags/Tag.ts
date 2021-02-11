import {Command, CommandMessage, Guard} from "@typeit/discord";
import {roleConstraints} from "../../guards/RoleConstraint";
import {TagModel} from "../../model/DB/Tag.model";
import {Roles} from "../../enums/Roles";
import {StringUtils} from "../../utils/Utils";
import {BlockGuard} from "../../guards/BlockGuard";
import RolesEnum = Roles.RolesEnum;

export abstract class Tag {

    @Command("tag")
    @Guard(roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE), BlockGuard)
    private async tag(command: CommandMessage): Promise<TagModel> {
        let argumentArray = StringUtils.splitCommandLine(command.content);
        if (argumentArray.length !== 1) {
            command.reply("Invalid arguments, please supply tag name");
            return;
        }

        let [_name] = argumentArray;

        let tag = await TagModel.findOne({where: {_name: _name}});
        if (tag) {
            await tag.increment('_usage_count');
            command.channel.send(tag.get('_description'));
            return;
        }
        command.reply(`Could not find tag: ${_name}`);
    }
}