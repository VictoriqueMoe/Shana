import {AutoResponderModel} from "../../DB/entities/autoMod/impl/AutoResponder.model.js";
import {singleton} from "tsyringe";
import {DataSourceAware} from "../../DB/DAO/DataSourceAware.js";
import {EntityManager, Repository} from "typeorm";

@singleton()
export class AutoResponderManager extends DataSourceAware {

    public async editAutoResponder(obj: AutoResponderModel, currentTitle: string): Promise<AutoResponderModel> {
        try {
            return await this.ds.transaction(async entityManager => {
                await this.deleteAutoResponse(obj.guildId, currentTitle, entityManager);
                return this.addAutoResponder(obj, entityManager);
            });
        } catch (e) {
            throw new Error(e.message);
        }
    }

    public async addAutoResponder(obj: AutoResponderModel, transaction?: EntityManager): Promise<AutoResponderModel> {
        const repo: Repository<AutoResponderModel> = transaction ? transaction.getRepository(AutoResponderModel) : this.ds.getRepository(AutoResponderModel);
        const commitResult = await repo.save([obj]);
        return commitResult[0];
    }

    public getAllAutoResponders(guildId: string): Promise<AutoResponderModel[]> {
        return this.ds.getRepository(AutoResponderModel).find({
            where: {
                guildId
            }
        });
    }

    public async deleteAutoResponse(guildId: string, title: string, t?: EntityManager): Promise<boolean> {
        if (t) {
            const deleteResponse = await t.getRepository(AutoResponderModel).delete({
                guildId,
                title
            });
            return deleteResponse.affected === 1;
        } else {
            const transactionDelete = await this.ds.getRepository(AutoResponderModel).delete({
                guildId,
                title
            });
            return transactionDelete.affected === 1;
        }
    }

    public async getAutoResponderFromTitle(title: string, guildId: string): Promise<AutoResponderModel | null> {
        const fromDb = await this.ds.getRepository(AutoResponderModel).findOne({
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
