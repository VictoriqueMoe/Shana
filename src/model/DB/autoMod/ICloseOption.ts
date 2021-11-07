
/**
 * interface for close options. aka a model that can carry info about what module is closed
 */
export interface ICloseOption {

    /**
     * name of the module
     */
    moduleId: string;

    /**
     * is this module enabled
     */
    status: boolean;

    /**
     * Get the settings object for this module. this iss a JSON object
     */
    settings: Record<string, unknown>;
}