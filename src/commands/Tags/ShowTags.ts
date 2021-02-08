import {Command, CommandMessage, Description, Guard, Infos} from "@typeit/discord";
import {roleConstraints} from "../../guards/RoleConstraint";
import {TagModel} from "../../model/DB/Tag.model";
import {Roles} from "../../enums/Roles";
import RolesEnum = Roles.RolesEnum;
import {Message} from "discord.js";
import {BlockGuard} from "../../guards/BlockGuard";


export abstract class ShowTags {
    @Command("showTags")
    @Description(ShowTags.getDescription())
    @Guard(roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE), BlockGuard)
    private async showTags(command: CommandMessage): Promise<Message> {
        let allTags = await TagModel.findAll({attributes: ['_name']});
        let replyString = allTags.map(t => t.name).join('\n ') || 'No tags set.';
        return command.channel.send(`List of tags: \n ${replyString}`);
    }

    public static getDescription(): string {
        return "Shows all the tag names currently storied";
    }

}