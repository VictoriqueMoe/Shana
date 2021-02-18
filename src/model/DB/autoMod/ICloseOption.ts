import {Model} from "sequelize-typescript";

/**
 * interface for close options. aka a model that can carry info about what module is closed
 */
export interface ICloseOption extends Model {

    /**
     * name of the module
     */
    moduleId: string;

    /**
     * is this module enabled
     */
    status: boolean;
}