import {BaseDAO} from "../../../DAO/BaseDAO.js";
import {BookmarkModel} from "../../DB/guild/Bookmark.model.js";
import {singleton} from "tsyringe";
import {BaseGuildTextChannel, GuildMember, Message} from "discord.js";
import {ArrayUtils} from "../../../utils/Utils.js";
import typeorm from "typeorm";
const { getRepository } = typeorm;

@singleton()
export class BookmarkManager extends BaseDAO<BookmarkModel> {

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
        const repo = getRepository(BookmarkModel);
        const bookMarksExists = await repo.findOne({
            where: {
                guildId,
                userId: id
            }
        });
        if (bookMarksExists) {
            const messageIds = new Set<string>(bookMarksExists.messageIds);
            messageIds.add(messageToAddId);
            const arr = Array.from(messageIds);
            await repo.update({
                guildId,
                userId: id
            }, {
                messageIds: arr
            });
        } else {
            const newModel = BaseDAO.build(BookmarkModel, {
                guildId,
                userId: id,
                messageIds: [messageToAddId]
            });
            return super.commitToDatabase(repo, [newModel]).then(values => values[0]);
        }
    }

    public async deleteBookmark(member: GuildMember, message: Message | string): Promise<boolean> {
        const messageToDeleteId = typeof message === "string" ? message : message.id;
        if (!member) {
            return false;
        }
        const repo = getRepository(BookmarkModel);
        const {id} = member;
        const {guild} = member;
        const guildId = guild.id;
        const bookMarksExists = await repo.findOne({
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
                return (await repo.delete({
                    guildId,
                    userId: id
                })).affected === 1;
            } else {
                const updateResult = await repo.update({
                    guildId,
                    userId: id
                }, {
                    messageIds
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
        const bookMarks = await getRepository(BookmarkModel).findOne({
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