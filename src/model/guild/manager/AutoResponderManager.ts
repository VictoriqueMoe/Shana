import {BaseDAO} from "../../../DAO/BaseDAO";
import {AutoResponderModel} from "../../DB/autoMod/impl/AutoResponder.model";

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