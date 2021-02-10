import {Column, Model, Table} from "sequelize-typescript";

@Table
export class SpecialKickModel extends Model{

    @Column({unique: true})
    public userId: string;

}