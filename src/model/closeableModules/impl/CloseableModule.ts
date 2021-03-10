import {BaseDAO} from "../../../DAO/BaseDAO";
import {ICloseOption} from "../../DB/autoMod/ICloseOption";
import {Main} from "../../../Main";
import {ICloseableModule} from "../ICloseableModule";
import {ISubModule} from "../dynoAutoMod/subModules/ISubModule";
import * as Immutable from "immutable";
import {SubModuleManager} from "../manager/SubModuleManager";

export abstract class CloseableModule extends BaseDAO<ICloseOption> implements ICloseableModule {

    private _isEnabled: boolean;

    // @ts-ignore
    protected constructor(private _model: typeof ICloseOption, private _uid:string) {
        super();
        Main.closeableModules.add(this);
    }

    public abstract get moduleId(): string;

    public abstract get isDynoReplacement(): boolean;

    public get submodules(): Immutable.Set<ISubModule> {
        return SubModuleManager.instance.getSubModulesFromParent(this);
    }

    public get uid():string{
        return this._uid;
    }

    /**
     * Close this module, this prevents all events from being fired. events are NOT queued
     */
    public async close(): Promise<boolean> {
        const m = await this._model.update(
            {
                "status": false
            },
            {
                where: {
                    "moduleId": this.moduleId
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
    public async open(): Promise<boolean> {
        const m = await this._model.update(
            {
                "status": true
            },
            {
                where: {
                    "moduleId": this.moduleId
                }
            }
        );
        this._isEnabled = m[0] === 1;
        console.log(`Module: ${this.moduleId} enabled`);
        return m[0] === 1;
    }

    public get isEnabled(): boolean {
        return this._isEnabled;
    }
}