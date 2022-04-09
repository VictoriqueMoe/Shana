import {BaseDAO} from "../../../DAO/BaseDAO";
import {AutoResponderModel} from "../../DB/entities/autoMod/impl/AutoResponder.model";
import {singleton} from "tsyringe";
import {getManager, getRepository, Repository, Transaction, TransactionRepository} from "typeorm";

@singleton()
export class AutoResponderManager extends BaseDAO<AutoResponderModel> {

    public constructor() {
        super();
    }

    @Transaction()
    public async editAutoResponder(obj: AutoResponderModel, currentTitle: string, @TransactionRepository(AutoResponderModel) editResponderRepo?: Repository<AutoResponderModel>): Promise<AutoResponderModel> {
        try {
            await this.deleteAutoResponse(obj.guildId, currentTitle, editResponderRepo);
            return this.addAutoResponder(obj, editResponderRepo);
        } catch (e) {
            throw new Error(e.message);
        }
    }

    public async addAutoResponder(obj: AutoResponderModel, transaction?: Repository<AutoResponderModel>): Promise<AutoResponderModel> {
        if (transaction) {
            const commitResult = await super.commitToDatabase(transaction, [obj]);
            return commitResult[0];
        }
        const commitResult = await super.commitToDatabase(getManager(), [obj], AutoResponderModel);
        return commitResult[0];
    }

    public async getAllAutoResponders(guildId: string): Promise<AutoResponderModel[]> {
        return getRepository(AutoResponderModel).find({
            where: {
                guildId
            }
        });
    }

    public async deleteAutoResponse(guildId: string, title: string, t?: Repository<AutoResponderModel>): Promise<boolean> {
        if (t) {
            const deleteResponse = await t.delete({
                guildId,
                title
            });
            return deleteResponse.affected === 1;
        } else {
            const transactionDelete = await getRepository(AutoResponderModel).delete({
                guildId,
                title
            });
            return transactionDelete.affected === 1;
        }
    }

    public async getAutoResponderFromTitle(title: string, guildId: string): Promise<AutoResponderModel | null> {
        const fromDb = await getRepository(AutoResponderModel).findOne({
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
