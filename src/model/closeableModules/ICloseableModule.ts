import {ISubModule} from "./dynoAutoMod/subModules/ISubModule";
import * as Immutable from "immutable";

/**
 * A closable module is a module that can be deactivated and activated dynamically, this encapsulated a "Module" in the context of this application
 */
export interface ICloseableModule {

    /**
     * ID of this module
     */
    readonly moduleId: string;

    /**
     * Unique ID of this CLASS
     */
    readonly uid:string;

    /**
     * Retrun true if this module is intended to replace dyno
     */
    readonly isDynoReplacement: boolean;

    /**
     * Get an array of  child submodules for this module. if thwre are any
     */
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