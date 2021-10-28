import {BaseDAO} from "../../../DAO/BaseDAO";
import {AutoResponderModel} from "../../DB/autoMod/impl/AutoResponder.model";
import {singleton} from "tsyringe";
import {Sequelize} from "sequelize-typescript";
import {Transaction} from "sequelize/types/lib/transaction";

@singleton()
export class AutoResponderManager extends BaseDAO<AutoResponderModel> {

    public constructor(private _dao: Sequelize) {
        super();
    }

    public async editAutoResponder(obj: AutoResponderModel, currentTitle: string): Promise<AutoResponderModel> {
        try {
            return await this._dao.transaction(async t => {
                await this.deleteAutoResponse(obj.guildId, currentTitle, t);
                return this.addAutoResponder(obj, t);
            });
        } catch (e) {
            throw new Error(e.message);
        }
    }

    public async addAutoResponder(obj: AutoResponderModel, transaction?: Transaction): Promise<AutoResponderModel> {
        return super.commitToDatabase(obj, {}, false, transaction);
    }

    public async getAllAutoResponders(guildId: string): Promise<AutoResponderModel[]> {
        return AutoResponderModel.findAll({
            where: {
                guildId
            }
        });
    }

    public async deleteAutoResponse(guildId: string, title: string, transaction?: Transaction): Promise<boolean> {
        return (await AutoResponderModel.destroy({
            transaction,
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