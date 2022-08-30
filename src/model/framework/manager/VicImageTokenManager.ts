import {singleton} from "tsyringe";
import {DataSourceAware} from "../../DB/DAO/DataSourceAware.js";
import {VicImageTokenModel} from "../../DB/entities/VicImageToken.model.js";
import {ObjectUtil} from "../../../utils/Utils.js";
import {ISearchBase} from "../../ISearchBase.js";
import {AutocompleteInteraction} from "discord.js";
import Fuse from "fuse.js";
import FuseResult = Fuse.FuseResult;

@singleton()
export class VicImageTokenManager extends DataSourceAware implements ISearchBase<VicImageTokenModel> {

    public async validateToken(token: string, userId: string): Promise<boolean> {
        const repo = this.ds.getRepository(VicImageTokenModel);
        const model = await repo.findOne({
            where: {
                value: token,
                name: userId
            }
        });
        return ObjectUtil.isValidObject(model);
    }

    public search(interaction: AutocompleteInteraction): FuseResult<VicImageTokenModel>[] | Promise<FuseResult<VicImageTokenModel>[]> {
        return undefined;
    }
}
