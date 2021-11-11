import {BaseDAO} from "../../DAO/BaseDAO";
import {SettingsModel} from "../DB/guild/Settings.model";
import {SETTINGS} from "../../enums/SETTINGS";
import {ArrayUtils, ObjectUtil} from "../../utils/Utils";
import {singleton} from "tsyringe";
import {getRepository} from "typeorm";

export type ALL_SETTINGS_TYPE = {
    [key in keyof typeof SETTINGS]?: string
}

/**
 * ideally this will user super dao for retrieving and saving settings
 */
@singleton()
export class SettingsManager extends BaseDAO<SettingsModel> {
    private readonly _cache: Map<string, ALL_SETTINGS_TYPE>;

    private readonly _repository = getRepository(SettingsModel);

    public constructor() {
        super();
        this._cache = new Map();
    }


    public refresh(): void {
        this._cache.clear();
    }

    public async getPrefix(guildId: string): Promise<string> {
        if (!ObjectUtil.validString(guildId)) {
            return "~";
        }
        return this.getSetting(SETTINGS.PREFIX, guildId);
    }

    /**
     * Get an object of ALL settings valid for this guild
     * @param guildId
     */
    public async getAllSettings(guildId: string): Promise<ALL_SETTINGS_TYPE> {
        if (this._cache.has(guildId)) {
            return this._cache.get(guildId);
        }
        const models = await this._repository.find({
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
        const model = await this._repository.findOne({
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
    public async saveOrUpdateSetting(setting: SETTINGS, value: string, guildId: string, saveOnly: boolean = false): Promise<number> {
        const newModel = BaseDAO.build(SettingsModel, {
            setting,
            value,
            guildId
        });
        let retRow = -1;
        let textPrefix = "";
        if (await this._repository.count({
            where: {
                guildId,
                setting
            }
        }) > 0) {
            if (saveOnly) {
                return 0;
            }
            const result = await this._repository.update({
                value
            }, {
                guildId,
                setting
            });
            this.updateCache(setting, value, guildId);
            retRow = result[0];
            textPrefix = "Updated";
        } else {
            await super.commitToDatabase(this._repository, [newModel]);
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
        return (this._cache.get(guildId)?.[setting]) ?? null;
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