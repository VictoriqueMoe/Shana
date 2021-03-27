import {BaseDAO} from "../../DAO/BaseDAO";
import {SettingsModel} from "../DB/Settings.model";
import {SETTINGS} from "../../enums/SETTINGS";
import {ArrayUtils} from "../../utils/Utils";

export type ALL_SETTINGS_TYPE = {
    [key in keyof typeof SETTINGS]?: string
}

/**
 * idealy this will user super dao for retrieving and saving  settings
 */
export class SettingsManager extends BaseDAO<SettingsModel> {
    private readonly _cache: Map<string, ALL_SETTINGS_TYPE>;

    private constructor() {
        super();
        this._cache = new Map();
    }

    private static _instance: SettingsManager;

    public static get instance(): SettingsManager {
        if (!SettingsManager._instance) {
            SettingsManager._instance = new SettingsManager();
        }

        return SettingsManager._instance;
    }

    /**
     * Get an object of ALL settings valid for this guild
     * @param guildId
     */
    public async getAllSettings(guildId: string): Promise<ALL_SETTINGS_TYPE> {
        if (this._cache.has(guildId)) {
            return this._cache.get(guildId);
        }
        const models = await SettingsModel.findAll({
            where: {
                guildId
            }
        });
        if (!ArrayUtils.isValidArray(models)) {
            return {};
        }
        for (const model of models) {
            this.updateCache(model.setting as unknown as SETTINGS, model.value, guildId);
        }
        return this._cache.get(guildId);
    }

    /**
     * Get the setting from the database
     * @param setting
     * @param guildId
     */
    public async getSetting(setting: SETTINGS, guildId: string): Promise<string | null> {
        if (this.getFromCache(setting, guildId)) {
            return this.getFromCache(setting, guildId);
        }
        const model = await SettingsModel.findOne({
            where: {
                setting,
                guildId
            }
        });
        if (!model) {
            return null;
        }
        this.updateCache(setting, model.value, guildId);
        return model.value;
    }

    /**
     * Save (or update if the setting exists) the setting to the database
     * @param setting
     * @param value
     * @param guildId
     * @param saveOnly
     */
    public async saveOrUpdateSetting(setting: SETTINGS, value: string, guildId: string, saveOnly = false): Promise<number> {
        const newModel = new SettingsModel({
            setting,
            value,
            guildId
        });
        let retRow = -1;
        let textPrefix = "";
        if(await SettingsModel.count({
            where:{
                guildId,
                setting
            }
        }) > 0){
            if (saveOnly) {
                return 0;
            }
            const result = await SettingsModel.update({
                value
            }, {
                where: {
                    guildId,
                    setting
                }
            });
            this.updateCache(setting, value, guildId);
            retRow = result[0];
            textPrefix = "Updated";
        }else{
            await super.commitToDatabase(newModel, {}, true);
            this.updateCache(setting, value, guildId);
            retRow = 1;
            textPrefix = "Saved";
        }
        if (retRow > 0) {
            console.log(`${textPrefix} setting: "${setting}" with value: "${value}" on guildId: ${guildId}`);
        }
        return retRow;
    }

    private getFromCache(setting: SETTINGS, guildId: string): string | null {
        return (this._cache.get(guildId)?.[setting]) || null;
    }

    private updateCache(setting: SETTINGS, value: string, guildId: string): void {
        let obj: ALL_SETTINGS_TYPE = {};
        if (this._cache.has(guildId)) {
            obj = this._cache.get(guildId);
        }
        if (obj[setting] === value) {
            return;
        }
        // @ts-ignore
        obj[setting] = value;
        this._cache.set(guildId, obj);
    }
}