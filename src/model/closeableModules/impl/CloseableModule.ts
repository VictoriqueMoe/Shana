import {BaseDAO} from "../../../DAO/BaseDAO";
import {ICloseOption} from "../../DB/autoMod/ICloseOption";
import {Main} from "../../../Main";
import {ICloseableModule} from "../ICloseableModule";
import {ISubModule} from "../subModules/ISubModule";
import * as Immutable from "immutable";
import {SubModuleManager} from "../manager/SubModuleManager";
import {ModuleSettings} from "../ModuleSettings";
import {ObjectUtil} from "../../../utils/Utils";

export abstract class CloseableModule<T extends ModuleSettings> extends BaseDAO<ICloseOption> implements ICloseableModule<T> {

    private _isEnabled: boolean | null = null;

    protected _settings: T | null;

    // @ts-ignore
    protected constructor(private _model: typeof ICloseOption, private _uid: string) {
        super();
        Main.closeableModules.add(this);
    }

    public async saveSettings(guildId: string, setting: T, merge = false): Promise<void> {
        let obj = setting;
        if (merge) {
            const percistedSettings = await this.getSettings(guildId);
            obj = {...percistedSettings, ...setting};
        }
        await this._model.update(
            {
                "settings": obj
            },
            {
                where: {
                    "moduleId": this.moduleId,
                    guildId
                }
            }
        );
        this._settings = obj;
    }

    public async getSettings(guildId: string): Promise<T | null> {
        if (this._settings) {
            return this._settings;
        }
        const model: ICloseOption = await this._model.findOne({
            attributes: ["settings"],
            where: {
                "moduleId": this.moduleId,
                guildId
            }
        });
        if (!model || !ObjectUtil.isValidObject(model.settings)) {
            return null;
        }
        this._settings = model.settings as T;
        return this._settings;
    }

    public abstract get moduleId(): string;

    public abstract get isDynoReplacement(): boolean;

    public get submodules(): Immutable.Set<ISubModule> {
        return SubModuleManager.instance.getSubModulesFromParent(this);
    }

    public get uid(): string {
        return this._uid;
    }

    /**
     * Close this module, this prevents all events from being fired. events are NOT queued
     */
    public async close(guildId: string): Promise<boolean> {
        const m = await this._model.update(
            {
                "status": false
            },
            {
                where: {
                    "moduleId": this.moduleId,
                    guildId
                }
            }
        );
        this._isEnabled = m[0] === 1;
        console.log(`Module: ${this.moduleId} disabled`);
        return m[0] === 1;
    }

    /**
     * Opens this module, allowing events to be fired.
     */
    public async open(guildId: string): Promise<boolean> {
        const m = await this._model.update(
            {
                "status": true
            },
            {
                where: {
                    "moduleId": this.moduleId,
                    guildId
                }
            }
        );
        this._isEnabled = m[0] === 1;
        console.log(`Module: ${this.moduleId} enabled`);
        return m[0] === 1;
    }

    public async isEnabled(guildId: string): Promise<boolean> {
        if (this._isEnabled === null) {
            const model: ICloseOption = await this._model.findOne({
                attributes: ["status"],
                where: {
                    "moduleId": this.moduleId,
                    guildId
                }
            });
            this._isEnabled = model.status;
        }
        return this._isEnabled;
    }
}