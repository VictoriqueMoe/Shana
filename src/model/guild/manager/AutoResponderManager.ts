import {BaseDAO} from "../../../DAO/BaseDAO";
import {AutoResponderModel} from "../../DB/autoMod/impl/AutoResponder.model";
import {Main} from "../../../Main";

export class AutoResponderManager extends BaseDAO<AutoResponderModel> {
    private constructor() {
        super();
    }

    private static _instance: AutoResponderManager;

    public static get instance(): AutoResponderManager {
        if (!AutoResponderManager._instance) {
            AutoResponderManager._instance = new AutoResponderManager();
        }
        return AutoResponderManager._instance;
    }

    public async editAutoResponder(obj: AutoResponderModel, currentTitle: string): Promise<AutoResponderModel> {
        return Main.dao.transaction(async t => {
            await this.deleteAutoResponse(obj.guildId, currentTitle);
            return this.addAutoResponder(obj);
        });
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