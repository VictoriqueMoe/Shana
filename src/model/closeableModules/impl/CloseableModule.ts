import type {ICloseOption} from "../../DB/entities/autoMod/ICloseOption.js";
import type {ICloseableModule} from "../ICloseableModule.js";
import type {ISubModule} from "../subModules/ISubModule.js";
import * as Immutable from "immutable";
import type {ModuleSettings} from "../settings/ModuleSettings.js";
import {ObjectUtil} from "../../../utils/Utils.js";
import {CloseOptionModel} from "../../DB/entities/autoMod/impl/CloseOption.model.js";
import {container, delay} from "tsyringe";
import {DataSourceAware} from "../../DB/DAO/DataSourceAware.js";
import {SubModuleManager} from "../../framework/manager/SubModuleManager.js";
import logger from "../../../utils/LoggerFactory.js";

export abstract class CloseableModule<T extends ModuleSettings> extends DataSourceAware implements ICloseableModule<T> {

    protected readonly _subModuleManager: SubModuleManager;
    private _isEnabled: Map<string, boolean | null>;
    private _settings: Map<string, T | null>;

    protected constructor() {
        super();
        this._settings = new Map();
        this._isEnabled = new Map();
        this._subModuleManager = container.resolve(delay(() => SubModuleManager));
    }

    public abstract get moduleId(): string;

    public get submodules(): Immutable.Set<ISubModule> {
        return this._subModuleManager.getSubModulesFromParent(this);
    }

    public async saveSettings(guildId: string, setting: T, merge = false): Promise<void> {
        let obj = setting;
        if (merge) {
            const percistedSettings = await this.getSettings(guildId);
            obj = {...percistedSettings, ...setting};
        }
        try {
            await this._ds.getRepository(CloseOptionModel).update(
                {
                    moduleId: this.moduleId,
                    guildId
                },
                {
                    settings: obj
                }
            );
        } catch (e) {
            logger.error(e);
            throw e;
        }

        this._settings.set(guildId, obj);
    }

    public async getSettings(guildId: string, force = false): Promise<T> {
        if (!force && this._settings.has(guildId)) {
            return this._settings.get(guildId);
        }
        const model: ICloseOption = await this._ds.getRepository(CloseOptionModel).findOne({
            select: ["settings"],
            where: {
                moduleId: this.moduleId,
                guildId
            }
        });
        if (!model || !ObjectUtil.isValidObject(model.settings)) {
            return {} as T;
        }
        this._settings.set(guildId, model.settings as T);
        return this._settings.get(guildId);
    }

    /**
     * Close this module, this prevents all events from being fired. events are NOT queued
     */
    public async close(guildId: string): Promise<boolean> {
        const m = await this._ds.getRepository(CloseOptionModel).update(
            {
                moduleId: this.moduleId,
                guildId
            },
            {
                status: false
            }
        );
        this._isEnabled.set(guildId, m.affected === 1);
        logger.info(`Module: ${this.moduleId} disabled`);
        return m[0] === 1;
    }

    /**
     * Opens this module, allowing events to be fired.
     */
    public async open(guildId: string): Promise<boolean> {
        const m = await this._ds.getRepository(CloseOptionModel).update(
            {
                moduleId: this.moduleId,
                guildId
            },
            {
                status: true
            }
        );
        this._isEnabled.set(guildId, m.affected === 1);
        logger.info(`Module: ${this.moduleId} enabled for guild ${guildId}`);
        return m[0] === 1;
    }

    public async isEnabled(guildId: string): Promise<boolean> {
        if (!this._isEnabled.has(guildId)) {
            const model: ICloseOption = await this._ds.getRepository(CloseOptionModel).findOne({
                select: ["status"],
                where: {
                    moduleId: this.moduleId,
                    guildId
                }
            });
            if (!model) {
                return false;
            }
            this._isEnabled.set(guildId, model.status);
        }
        return this._isEnabled.get(guildId);
    }
}
