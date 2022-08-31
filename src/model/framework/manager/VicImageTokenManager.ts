import {singleton} from "tsyringe";
import {DataSourceAware} from "../../DB/DAO/DataSourceAware.js";
import {VicImageTokenModel} from "../../DB/entities/VicImageToken.model.js";
import {DbUtils, ObjectUtil} from "../../../utils/Utils.js";
import {defaultSearch, fuseOptions, ISearchBase} from "../../ISearchBase.js";
import {AutocompleteInteraction} from "discord.js";
import Fuse from "fuse.js";
import {PostConstruct} from "../decorators/PostConstruct.js";
import {ShanaFuse} from "../../impl/ShanaFuse.js";
import FuseResult = Fuse.FuseResult;

@singleton()
export class VicImageTokenManager extends DataSourceAware implements ISearchBase<VicImageTokenModel> {

    private _fuseCache: ShanaFuse<VicImageTokenModel>;

    public async validateToken(token: string, userId: string): Promise<boolean> {
        if (!ObjectUtil.validString(token)) {
            return false;
        }
        const repo = this.ds.getRepository(VicImageTokenModel);
        const model = await repo.findOne({
            where: {
                value: userId,
                name: token
            }
        });
        return ObjectUtil.isValidObject(model);
    }

    public async registerToken(userId: string): Promise<string> {
        const repo = this.ds.getRepository(VicImageTokenModel);
        const newToken = ObjectUtil.guid();
        const newModel = DbUtils.build(VicImageTokenModel, {
            value: userId,
            name: newToken
        });
        await repo.save(newModel);
        this._fuseCache.add(newModel);
        return newToken;
    }

    public search(interaction: AutocompleteInteraction): FuseResult<VicImageTokenModel>[] | Promise<FuseResult<VicImageTokenModel>[]> {
        const member = interaction.user;
        const result = defaultSearch(interaction, this._fuseCache);
        return result.filter(match => match.item.value === member.id);
    }

    @PostConstruct
    private async init(): Promise<void> {
        const repo = this.ds.getRepository(VicImageTokenModel);
        const allModels = await repo.find();
        this._fuseCache = new ShanaFuse(allModels, fuseOptions);
    }
}
