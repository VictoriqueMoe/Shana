export type SubModuleSettings = {
    id?: string,
    isActive?: boolean
};


/**
 * A sub module is  something that belongs to the parent module
 */
export interface ISubModule {

    /**
     * sub-module ID
     */
    readonly id: string;

    /**
     * Get the parent module ID this belongs to
     */
    readonly parentModuleId: string;

    /**
     * Is this filter active
     */
    isActive(guildId: string): Promise<boolean>;
}
