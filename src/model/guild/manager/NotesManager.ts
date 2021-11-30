import {singleton} from "tsyringe";
import {BaseDAO} from "../../../DAO/BaseDAO";
import {NotesModel} from "../../DB/guild/Notes.model";
import {AutocompleteInteraction, GuildMember} from "discord.js";
import {getRepository} from "typeorm";
import {ObjectUtil} from "../../../utils/Utils";
import {defaultSearch, ISearchBase, options} from "../../ISearchBase";
import Fuse from "fuse.js";
import {PostConstruct} from "../../decorators/PostConstruct";
import {ShanaFuse} from "../../Impl/ShanaFuse";

@singleton()
export class NotesManager extends BaseDAO<NotesModel> implements ISearchBase<NotesModel> {
    private _fuseCache: ShanaFuse<NotesModel> = null;

    @PostConstruct
    private async init(): Promise<void> {
        const repo = getRepository(NotesModel);
        const allModels = await repo.find();
        this._fuseCache = new ShanaFuse(allModels, options);
    }

    public async getNotes(member: GuildMember, title?: string): Promise<NotesModel[]> {
        const guildId = member.guild.id;
        const userId = member.id;
        const repo = getRepository(NotesModel);
        const whereClause = {
            guildId,
            userId
        };
        if (ObjectUtil.validString(title)) {
            whereClause["name"] = title;
        }
        return repo.find({
            where: whereClause
        });
    }

    public async removeNote(member: GuildMember, title: string): Promise<boolean> {
        const guildId = member.guild.id;
        const userId = member.id;
        const repo = getRepository(NotesModel);
        const deleteResult = await repo.delete({
            guildId,
            name: title,
            userId
        });
        this._fuseCache.remove(doc => {
            return doc.name === title;
        });
        return deleteResult.affected === 1;
    }

    public async addOrUpdateNote(member: GuildMember, title: string, message: string, update: boolean = false): Promise<NotesModel> {
        const guildId = member.guild.id;
        const userId = member.id;
        const repo = getRepository(NotesModel);
        if (update) {
            const exists = await repo.findOne({
                where: {
                    guildId,
                    name: title,
                    userId
                }
            });
            if (!exists) {
                throw new Error(`Unable to find note with title: "${title}"`);
            }
            exists.text = message;
            return super.commitToDatabase(repo, [exists]).then(values => {
                const v = values[0];
                this._fuseCache.remove(doc => {
                    return doc.name === exists.name;
                });
                this._fuseCache.add(v);
                return v;
            });
        }
        const newModel = BaseDAO.build(NotesModel, {
            guildId,
            userId,
            name: title,
            text: message
        });
        return super.commitToDatabase(repo, [newModel]).then(values => {
            const v = values[0];
            this._fuseCache.add(v);
            return v;
        });
    }

    public search(interaction: AutocompleteInteraction): Fuse.FuseResult<NotesModel>[] {
        const member = interaction.user;
        const guildId = interaction.guildId;
        const result = defaultSearch(interaction, this._fuseCache);
        return result.filter(match =>
            match.item.guildId === guildId && match.item.userId === member.id
        );
    }
}