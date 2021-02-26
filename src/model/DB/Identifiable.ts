import {Model} from "sequelize-typescript";

export interface Identifiable extends Model {
    readonly userId: string;
}