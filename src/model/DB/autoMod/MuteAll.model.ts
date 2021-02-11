import {Column, Default, Model, Table} from "sequelize-typescript";

@Table
export class MuteAllModel extends Model{

    @Default(false)
    @Column
    public includeStaff: boolean;

    @Default(false)
    @Column
    public enabled: boolean;
}