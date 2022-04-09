import {BaseDAO} from "../../../DAO/BaseDAO";
import {BookmarkModel} from "../../DB/entities/guild/Bookmark.model";
import {singleton} from "tsyringe";
import {BaseGuildTextChannel, GuildMember, Message} from "discord.js";
import {ArrayUtils} from "../../../utils/Utils";
import {getRepository} from "typeorm";

@singleton()
export class BookmarkManager extends BaseDAO<BookmarkModel> {

    /**
     * adds a bew bookmark to a member or makes a new entry
     * @param member
     * @param message
     */
    public async addBookmark(member: GuildMember, message: Message | string): Promise<BookmarkModel> {
        const messageToAddUrls = typeof message === "string" ? message : message.url;
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
            messageIds.add(messageToAddUrls);
            const arr = Array.from(messageIds);
            await repo.update({
                guildId,
                userId: id
            }, {
                messageIds: arr
            });
            return bookMarksExists;
        } else {
            const newModel = BaseDAO.build(BookmarkModel, {
                guildId,
                userId: id,
                messageIds: [messageToAddUrls]
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
            const indexInArray = messageIds.findIndex(value => {
                const [messageId] = value.split("/").splice(6);
                return messageId === messageToDeleteId;
            });
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
        for (const messageUrl of allMessageIds) {
            const [channelId, messageId] = messageUrl.split("/").splice(5);
            const channel = await guild.channels.fetch(channelId);
            if (channel instanceof BaseGuildTextChannel) {
                try {
                    const message = await channel.messages.fetch(messageId);
                    retArr.push(message);
                } catch {
                    await this.deleteBookmark(member, messageId);
                }
            }
        }
        return retArr;
    }
}
