import {ISubModule} from "./dynoAutoMod/subModules/ISubModule";
import * as Immutable from "immutable";

export interface ICloseableModule {

    /**
     * ID of this module
     */
    readonly moduleId: string;

    /**
     * Retrun true if this module is intended to replace dyno
     */
    readonly isDynoReplacement: boolean;

    readonly submodules: Immutable.Set<ISubModule>;

    /**
     * Close this module, this prevents all events from being fired. events are NOT queued
     */
    close(): Promise<boolean>;

    /**
     * Opens this module, allowing events to be fired.
     */
    open(): Promise<boolean>;
}