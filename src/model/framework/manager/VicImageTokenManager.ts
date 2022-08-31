import {singleton} from "tsyringe";
import {DataSourceAware} from "../../DB/DAO/DataSourceAware.js";
import {VicImageTokenModel} from "../../DB/entities/VicImageToken.model.js";
import {DbUtils, ObjectUtil} from "../../../utils/Utils.js";

@singleton()
export class VicImageTokenManager extends DataSourceAware {


    public async validateUser(userId: string): Promise<boolean> {
        if (!ObjectUtil.validString(userId)) {
            return false;
        }
        const repo = this.ds.getRepository(VicImageTokenModel);
        const model = await repo.findOne({
            where: {
                userId
            }
        });
        return ObjectUtil.isValidObject(model);
    }

    public async registerUser(userId: string): Promise<void> {
        if (await this.validateUser(userId)) {
            return;
        }
        const repo = this.ds.getRepository(VicImageTokenModel);
        const newModel = DbUtils.build(VicImageTokenModel, {
            userId
        });
        await repo.save(newModel);
    }

    public async revokeUser(userId: string): Promise<boolean> {
        const repo = this.ds.getRepository(VicImageTokenModel);
        const existingModel = await repo.findOne({
            where: {
                userId
            }
        });
        if (!existingModel) {
            return false;
        }
        await repo.remove(existingModel);
        return true;
    }

}
