import type {ICloseableModule} from "../ICloseableModule.js";


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
     * Get the parent module this belongs to
     */
    readonly parentModule: ICloseableModule<any>;

    /**
     * Is this filter active
     */
    isActive(guildId: string): Promise<boolean>;
}
