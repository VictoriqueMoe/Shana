import type * as Immutable from "immutable";
import type {ModuleSettings} from "./settings/ModuleSettings.js";
import type {ISubModule} from "./subModules/ISubModule.js";

/**
 * A closable module is a module that can be deactivated and activated dynamically, this encapsulated a "Module" in the context of this application
 */
export interface ICloseableModule<T extends ModuleSettings> {

    /**
     * ID of this module
     */
    readonly moduleId: string;

    /**
     * Get an array of  child submodules for this module. if thwre are any
     */
    readonly submodules: Immutable.Set<ISubModule>;

    /**
     * Get the settings object of this module, may be null
     * @param guildId
     */
    getSettings(guildId: string): Promise<T | Record<string, never>>;

    /**
     * Save the setting for this module, this will overwrite the current settings. if merge is passed only the keys in the settings object will be updated
     * @param guildId
     * @param setting
     * @param merge
     */
    saveSettings(guildId: string, setting: T | null, merge?: boolean): Promise<void>;

    /**
     * Close this module, this prevents all events from being fired. events are NOT queued
     */
    close(guildId: string): Promise<boolean>;

    /**
     * Opens this module, allowing events to be fired.
     */
    open(guildId: string): Promise<boolean>;

    /**
     * Return true if this module is enabled, false otherwise
     * @param {string} guildId
     * @returns {Promise<boolean>}
     */
    isEnabled(guildId: string): Promise<boolean>;

    /**
     * Called when the application starts up and when a new guild is joined to set the defaults settings*
     * @param {string} guildId
     * @returns {Promise<void>}
     */
    setDefaults(guildId: string): Promise<void>;

}
