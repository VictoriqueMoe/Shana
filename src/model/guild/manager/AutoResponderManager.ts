import {BaseDAO} from "../../../DAO/BaseDAO";
import {AutoResponderModel} from "../../DB/autoMod/impl/AutoResponder.model";
import {singleton} from "tsyringe";
import {Sequelize} from "sequelize-typescript";

@singleton()
export class AutoResponderManager extends BaseDAO<AutoResponderModel> {

    public constructor(private _dao: Sequelize) {
        super();
    }

    public async editAutoResponder(obj: AutoResponderModel, currentTitle: string): Promise<AutoResponderModel> {
        const transaction = await this._dao.transaction();
        try {
            await this.deleteAutoResponse(obj.guildId, currentTitle);
            const ret = this.addAutoResponder(obj);
            await transaction.commit();
            return ret;
        } catch (e) {
            await transaction.rollback();
            throw new Error(e.message);
        }
    }

    public async addAutoResponder(obj: AutoResponderModel): Promise<AutoResponderModel> {
        return super.commitToDatabase(obj);
    }

    public async getAllAutoResponders(guildId: string): Promise<AutoResponderModel[]> {
        return AutoResponderModel.findAll({
            where: {
                guildId
            }
        });
    }

    public async deleteAutoResponse(guildId: string, title: string): Promise<boolean> {
        return (await AutoResponderModel.destroy({
            where: {
                guildId,
                title
            }
        }) === 1);
    }

    public async getAutoResponderFromTitle(title: string, guildId: string): Promise<AutoResponderModel | null> {
        const fromDb = await AutoResponderModel.findOne({
            where: {
                title,
                guildId
            }
        });
        if (fromDb) {
            return fromDb;
        }
        return null;
    }
}