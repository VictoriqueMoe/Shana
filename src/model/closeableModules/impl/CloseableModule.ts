import {BaseDAO} from "../../../DAO/BaseDAO";
import {ICloseOption} from "../../DB/autoMod/ICloseOption";
import {Main} from "../../../Main";
import {ICloseableModule} from "../ICloseableModule";
import {ISubModule} from "../subModules/ISubModule";
import * as Immutable from "immutable";
import {SubModuleManager} from "../manager/SubModuleManager";
import {ModuleSettings} from "../ModuleSettings";
import {GuildUtils, ObjectUtil} from "../../../utils/Utils";
import {GuildMember, TextBasedChannels} from "discord.js";
import {Roles} from "../../../enums/Roles";
import {CloseOptionModel} from "../../DB/autoMod/impl/CloseOption.model";
import RolesEnum = Roles.RolesEnum;

export abstract class CloseableModule<T extends ModuleSettings> extends BaseDAO<ICloseOption> implements ICloseableModule<T> {

    private _isEnabled: Map<string, boolean | null>;

    private _settings: Map<string, T | null>;

    // @ts-ignore
    protected constructor(private _model: typeof ICloseOption, private _uid: string) {
        super();
        Main.closeableModules.add(this);
        this._settings = new Map();
        this._isEnabled = new Map();
    }

    public abstract get moduleId(): string;

    public abstract get isDynoReplacement(): boolean;

    public get submodules(): Immutable.Set<ISubModule> {
        return SubModuleManager.instance.getSubModulesFromParent(this);
    }

    public get uid(): string {
        return this._uid;
    }

    public async saveSettings(guildId: string, setting: T, merge: boolean = false): Promise<void> {
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
        this._settings.set(guildId, obj);
    }

    public async getSettings(guildId: string, force: boolean = false): Promise<T | Record<string, never>> {
        if (!force && this._settings.has(guildId)) {
            return this._settings.get(guildId);
        }
        const model: ICloseOption = await this._model.findOne({
            attributes: ["settings"],
            where: {
                "moduleId": this.moduleId,
                guildId
            }
        });
        if (!model || !ObjectUtil.isValidObject(model.settings)) {
            return {};
        }
        this._settings.set(guildId, model.settings as T);
        return this._settings.get(guildId);
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
        this._isEnabled.set(guildId, m[0] === 1);
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
        this._isEnabled.set(guildId, m[0] === 1);
        console.log(`Module: ${this.moduleId} enabled`);
        return m[0] === 1;
    }

    public async isEnabled(guildId: string): Promise<boolean> {
        if (!this._isEnabled.has(guildId)) {
            const model: ICloseOption = await this._model.findOne({
                attributes: ["status"],
                where: {
                    "moduleId": this.moduleId,
                    guildId
                }
            });
            this._isEnabled.set(guildId, model.status);
        }
        return this._isEnabled.get(guildId);
    }

    /**
     * Will check if:
     * Current user is able to trigger this module
     * is this module enabled
     * @param guildId
     * @param member
     * @param channel
     * @protected
     */
    protected async canRun(guildId: string, member: GuildMember | null, channel: TextBasedChannels | null): Promise<boolean> {
        if (!ObjectUtil.validString(guildId)) {
            throw new Error("Unable to find guild");
        }
        const enabled = await this.isEnabled(guildId);
        if (!enabled) {
            return false;
        }

        if (member) {
            //TODO remove when i figure out how to get all closeable modules to implement ITriggerConstraint
            if (GuildUtils.isMemberAdmin(member)) {
                return false;
            }
            const memberRoles = member.roles.cache;
            const hardCodedImmunes = [RolesEnum.OVERWATCH_ELITE, RolesEnum.CIVIL_PROTECTION, RolesEnum.ZOMBIES];
            for (const immuneRoles of hardCodedImmunes) {
                if (memberRoles.has(immuneRoles)) {
                    return false;
                }
            }
        }
        const module = await CloseOptionModel.findOne({
            where: {
                moduleId: this.moduleId,
                guildId,
                status: true
            }
        });
        return module && module.status;
    }
}