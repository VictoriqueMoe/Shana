import {Command, CommandMessage, Description, Guard} from "@typeit/discord";
import {roleConstraints} from "../../guards/RoleConstraint";
import {TagModel} from "../../model/DB/Tag.model";
import {Roles} from "../../enums/Roles";
import {StringUtils} from "../../utils/Utils";
import {BlockGuard} from "../../guards/BlockGuard";
import {BaseDAO, UniqueViolationError} from "../../DAO/BaseDAO";
import {Message} from "discord.js";
import RolesEnum = Roles.RolesEnum;

export abstract class Tag extends BaseDAO<TagModel> {

    @Command("tag")
    @Guard(roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE), BlockGuard)
    private async tag(command: CommandMessage): Promise<TagModel> {
        const argumentArray = StringUtils.splitCommandLine(command.content);
        if (argumentArray.length !== 1) {
            command.reply("Invalid arguments, please supply tag name");
            return;
        }

        const [_name] = argumentArray;

        const tag = await TagModel.findOne({where: {_name: _name}});
        if (tag) {
            await tag.increment('_usage_count');
            command.channel.send(tag.get('_description'));
            return;
        }
        command.reply(`Could not find tag: ${_name}`);
    }

    @Command("addTag")
    @Guard(roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE), BlockGuard)
    private async addTag(command: CommandMessage): Promise<void> {
        const argumentArray = StringUtils.splitCommandLine(command.content);
        if (argumentArray.length !== 2) {
            command.reply("Invalid arguments, please supply tag; name, description");
            return;
        }
        const [_name, _description] = argumentArray;
        const _username = command.member.user.username;
        const tag = new TagModel({
            _name,
            _description,
            _username
        });
        try {
            await super.commitToDatabase(tag);
            command.reply(`Tag "${tag.name}" added.`);
        } catch (e) {
            if (e instanceof UniqueViolationError) {
                return;
            }
        }
    }

    @Command("removeTag")
    @Guard(roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE), BlockGuard)
    private async removeTag(command: CommandMessage): Promise<TagModel> {
        const argumentArray = StringUtils.splitCommandLine(command.content);
        if (argumentArray.length !== 1) {
            command.reply("Invalid arguments, please supply tag name");
            return;
        }

        const [_name] = argumentArray;

        const rowCount = await TagModel.destroy({where: {_name: _name}});
        if (rowCount != 1) {
            command.reply('That tag did not exist.');
            return;
        }
        command.reply('Tag deleted.');
    }

    @Command("showTags")
    @Description(Tag.getShowTagDescription())
    @Guard(roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE), BlockGuard)
    private async showTags(command: CommandMessage): Promise<Message> {
        const allTags = await TagModel.findAll({attributes: ['_name']});
        const replyString = allTags.map(t => t.name).join('\n ') || 'No tags set.';
        return command.channel.send(`List of tags: \n ${replyString}`);
    }

    @Command("tagInfo")
    @Guard(roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE), BlockGuard)
    private async tagInfo(command: CommandMessage): Promise<TagModel> {
        const argumentArray = StringUtils.splitCommandLine(command.content);
        if (argumentArray.length !== 1) {
            command.reply("Invalid arguments, please supply tag name");
            return;
        }
        const [_name] = argumentArray;
        const tag = await TagModel.findOne({
            where: {
                _name: _name
            }
        });
        if (tag) {
            command.channel.send(`${_name} was created by ${tag.username} at ${tag.createdAt} and has been used ${tag.usage_count} times.`);
            return;
        }
        command.reply(`Could not find tag: ${_name}`);
    }

    @Command("updateTag")
    @Guard(roleConstraints(RolesEnum.CIVIL_PROTECTION, RolesEnum.OVERWATCH_ELITE), BlockGuard)
    private async updateTag(command: CommandMessage): Promise<TagModel | null> {
        const argumentArray = StringUtils.splitCommandLine(command.content);
        if (argumentArray.length !== 2) {
            command.reply("Invalid arguments, please supply tag name to update and the new description");
            return;
        }
        const [_name, _description] = argumentArray;
        let numOfRowsUpdated = 0;
        try {
            const rowsUpdated = await TagModel.update({
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

    public static getShowTagDescription(): string {
        return "Shows all the tag names currently storied";
    }
}