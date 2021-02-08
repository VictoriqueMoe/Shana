import {AllowNull, Column, DataType, Default, Model, Table} from "sequelize-typescript";

@Table
export class MuteModel extends Model {

    @Column({unique: true})
    public userId: string;

    @Column(DataType.TEXT)
    public reason: string;

    @Column
    public creatorID: string;

    @AllowNull(false)
    @Default(0)
    @Column(DataType.INTEGER)
    public violationRules: number;


}