import {Column, DataType, Model, Table} from "sequelize-typescript";

@Table
export class SettingsModel extends Model {

    @Column({unique: true})
    public setting: string;

    @Column(DataType.TEXT)
    public value: string;

    @Column
    public guildId: string;
}