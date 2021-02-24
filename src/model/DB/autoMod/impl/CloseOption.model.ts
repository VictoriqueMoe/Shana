import {Column, Model, Table} from "sequelize-typescript";
import {ICloseOption} from "../ICloseOption";

@Table
export class CloseOptionModel extends Model implements ICloseOption {

    @Column({unique: true, allowNull: false})
    public moduleId: string;

    @Column({allowNull: false, defaultValue: false})
    public status: boolean;

}