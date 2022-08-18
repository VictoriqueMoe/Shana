import {DataSourceAware} from "../../DB/DAO/DataSourceAware.js";
import {singleton} from "tsyringe";
import {NotesModel} from "../../DB/entities/guild/Notes.model.js";
import {ShanaFuse} from "../../impl/ShanaFuse.js";
import {defaultSearch, fuseOptions, ISearchBase} from "../../ISearchBase.js";
import {AutocompleteInteraction, GuildMember} from "discord.js";
import {DbUtils, ObjectUtil} from "../../../utils/Utils.js";
import {PostConstruct} from "../decorators/PostConstruct.js";
import Fuse from "fuse.js";

@singleton()
export class NotesManager extends DataSourceAware implements ISearchBase<NotesModel> {
    private _fuseCache: ShanaFuse<NotesModel> = null;

    public async getNotes(member: GuildMember, title?: string): Promise<NotesModel[]> {
        const guildId = member.guild.id;
        const userId = member.id;
        const repo = this.ds.getRepository(NotesModel);
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
        const repo = this.ds.getRepository(NotesModel);
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

    public async addOrUpdateNote(member: GuildMember, title: string, message: string, update = false): Promise<NotesModel> {
        const guildId = member.guild.id;
        const userId = member.id;
        const repo = this.ds.getRepository(NotesModel);
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
            return repo.save(exists).then(v => {
                this._fuseCache.remove(doc => {
                    return doc.name === exists.name;
                });
                this._fuseCache.add(v);
                return v;
            });
        }
        const newModel = DbUtils.build(NotesModel, {
            guildId,
            userId,
            name: title,
            text: message
        });
        const savedModel = await repo.save(newModel);
        this._fuseCache.add(savedModel);
        return savedModel;
    }

    public search(interaction: AutocompleteInteraction): Fuse.FuseResult<NotesModel>[] {
        const member = interaction.user;
        const guildId = interaction.guildId;
        const result = defaultSearch(interaction, this._fuseCache);
        return result.filter(match =>
            match.item.guildId === guildId && match.item.userId === member.id
        );
    }

    @PostConstruct
    private async init(): Promise<void> {
        const repo = this.ds.getRepository(NotesModel);
        const allModels = await repo.find();
        this._fuseCache = new ShanaFuse(allModels, fuseOptions);
    }
}
