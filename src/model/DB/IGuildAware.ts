import {Model} from "sequelize-typescript";

export interface IGuildAware extends Model {
    readonly guildId: string;
}