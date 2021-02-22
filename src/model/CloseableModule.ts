import {BaseDAO} from "../DAO/BaseDAO";
import {ICloseOption} from "./DB/autoMod/ICloseOption";
import {Main} from "../Main";

export abstract class CloseableModule extends BaseDAO<ICloseOption> {

    // @ts-ignore
    protected constructor(private _model: typeof ICloseOption) {
        super();
        Main.closeableModules.add(this);
    }

    public abstract get moduleId(): string;

    public abstract get isDynoReplacement():boolean;

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
        return m[0] === 1;
    }
}