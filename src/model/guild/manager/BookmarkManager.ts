import {BaseDAO} from "../../../DAO/BaseDAO";
import {BookmarkModel} from "../../DB/guild/Bookmark.model";
import {singleton} from "tsyringe";
import {BaseGuildTextChannel, GuildMember, Message} from "discord.js";
import {ArrayUtils} from "../../../utils/Utils";
import {getRepository} from "typeorm";

@singleton()
export class BookmarkManager extends BaseDAO<BookmarkModel> {

    private readonly _repository = getRepository(BookmarkModel);

    /**
     * adds a bew bookmark to a member or makes a new entry
     * @param member
     * @param message
     */
    public async addBookmark(member: GuildMember, message: Message | string): Promise<BookmarkModel> {
        const messageToAddId = typeof message === "string" ? message : message.id;
        const {id} = member;
        const {guild} = member;
        const guildId = guild.id;
        const bookMarksExists = await this._repository.findOne({
            where: {
                guildId,
                userId: id
            }
        });
        if (bookMarksExists) {
            const messageIds = new Set<string>(bookMarksExists.messageIds);
            messageIds.add(messageToAddId);
            const arr = Array.from(messageIds);
            await this._repository.update({
                messageIds: arr
            }, {
                guildId,
                userId: id
            });
        } else {
            const newModel = BaseDAO.build(BookmarkModel, {
                guildId,
                userId: id,
                messageIds: [messageToAddId]
            });
            return super.commitToDatabase(this._repository, [newModel]).then(values => values[0]);
        }
    }

    public async deleteBookmark(member: GuildMember, message: Message | string): Promise<boolean> {
        const messageToDeleteId = typeof message === "string" ? message : message.id;
        if (!member) {
            return false;
        }
        const {id} = member;
        const {guild} = member;
        const guildId = guild.id;
        const bookMarksExists = await this._repository.findOne({
            where: {
                guildId,
                userId: id
            }
        });
        if (bookMarksExists) {
            const {messageIds} = bookMarksExists;
            const indexInArray = messageIds.indexOf(messageToDeleteId);
            if (indexInArray === -1) {
                return false;
            }
            messageIds.splice(indexInArray, 1);
            if (!ArrayUtils.isValidArray(messageIds)) {
                return (await this._repository.delete({
                    guildId,
                    userId: id
                })).affected === 1;
            } else {
                const updateResult = await this._repository.update({
                    messageIds
                }, {
                    guildId,
                    userId: id
                });
                return updateResult.affected == 1;
            }
        }
        return false;
    }

    public async getBookmarksFromMember(member: GuildMember): Promise<Message[]> {
        const {id} = member;
        const {guild} = member;
        const guildId = guild.id;
        const bookMarks = await this._repository.findOne({
            where: {
                guildId,
                userId: id
            }
        });
        const retArr: Message[] = [];
        if (!bookMarks) {
            return retArr;
        }
        const allMessageIds = bookMarks.messageIds;
        outer:
            for (const messageId of allMessageIds) {
                for (const [, channel] of guild.channels.cache) {
                    if (channel instanceof BaseGuildTextChannel) {
                        try {
                            const message = await channel.messages.fetch(messageId);
                            if (message.deleted) {
                                await this.deleteBookmark(member, messageId);
                            } else {
                                retArr.push(message);
                            }
                        } catch {
                            continue;
                        }
                        continue outer;
                    }
                }
            }
        return retArr;
    }
}