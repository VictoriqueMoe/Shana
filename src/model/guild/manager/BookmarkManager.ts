import {BaseDAO} from "../../../DAO/BaseDAO";
import {BookmarkModel} from "../../DB/Bookmark.model";
import {singleton} from "tsyringe";
import {GuildMember, Message, TextChannel} from "discord.js";

@singleton()
export class BookmarkManager extends BaseDAO<BookmarkModel> {

    /**
     * adds a bew bookmark to a member or makes a new entry
     * @param member
     * @param message
     */
    public async addBookmark(member: GuildMember, message: Message): Promise<BookmarkModel> {
        const {id} = member;
        const {guild} = member;
        const guildId = guild.id;
        const bookMarksExists = await BookmarkModel.findOne({
            where: {
                guildId,
                userId: id
            }
        });
        if (bookMarksExists) {
            const messageIds = new Set<string>(bookMarksExists.messageIds);
            messageIds.add(message.id);
            const arr = Array.from(messageIds);
            await BookmarkModel.update({
                messageIds: arr
            }, {
                where: {
                    guildId,
                    userId: id
                }
            });
        } else {
            const newModel = new BookmarkModel({
                guildId,
                userId: id,
                messageIds: [message.id]
            });
            return super.commitToDatabase(newModel);
        }
    }

    public async getBookmarksFromMember(member: GuildMember): Promise<Message[]> {
        const {id} = member;
        const {guild} = member;
        const guildId = guild.id;
        const bookMarks = await BookmarkModel.findOne({
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
                    if (channel instanceof TextChannel) {
                        try {
                            const message = await channel.messages.fetch(messageId);
                            if (!message.deleted) {
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