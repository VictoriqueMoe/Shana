import type {ICloseableModule} from "../ICloseableModule.js";

/**
 * A sub module is  something that belongs to the parent module
 */
export interface ISubModule {

    /**
     * sub-module ID
     */
    readonly id: string;

    /**
     * Is this filter active
     */
    isActive(guildId: string): Promise<boolean>;

    /**
     * Get the parent module this belongs to
     */
    readonly parentModule: ICloseableModule<any>;
}
