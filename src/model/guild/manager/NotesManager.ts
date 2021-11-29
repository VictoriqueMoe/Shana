import {singleton} from "tsyringe";
import {BaseDAO} from "../../../DAO/BaseDAO";
import {NotesModel} from "../../DB/guild/Notes.model";
import {GuildMember} from "discord.js";
import {getRepository} from "typeorm";

@singleton()
export class NotesManager extends BaseDAO<NotesModel> {

    public async addNote(member: GuildMember, title: string, message: string): Promise<NotesModel> {
        const guildId = member.guild.id;
        const userId = member.id;
        const repo = getRepository(NotesModel);
        const exists = await repo.findOne({
            where: {
                guildId,
                title,
                userId
            }
        });
        if (exists) {
            await repo.update({
                guildId,
                title,
                userId
            }, {
                title
            });
            return exists;
        }
        const newModel = BaseDAO.build(NotesModel, {
            guildId,
            userId,
            title
        });
        return super.commitToDatabase(repo, [newModel]).then(values => values[0]);
    }
}