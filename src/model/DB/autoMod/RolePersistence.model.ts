import {Column, Model, Table} from "sequelize-typescript";
import {Identifiable} from "../Identifiable";

@Table
export class RolePersistenceModel extends Model implements Identifiable{

    @Column({unique: true, allowNull: false})
    public userId: string;

    @Column
    public roleId: string;
}