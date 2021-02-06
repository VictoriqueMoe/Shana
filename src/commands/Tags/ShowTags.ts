import {Command, CommandMessage, Guard} from "@typeit/discord";
import {roleConstraints} from "../../guards/RoleConstraint";
import {TagModel} from "../../dao/Tag.model";
import {Roles} from "../../enums/Roles";
import RolesEnum = Roles.RolesEnum;
import {Message} from "discord.js";

export abstract class ShowTags {
    @Command("showTags")
    @Guard(roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE))
    private async showTags(command: CommandMessage): Promise<Message> {
        let allTags = await TagModel.findAll({attributes: ['_name']});
        let replyString = allTags.map(t => t.name).join('\n ') || 'No tags set.';
        return command.channel.send(`List of tags: ${replyString}`);
    }
}