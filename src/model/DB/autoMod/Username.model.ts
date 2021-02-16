import {Column, Default, Model, Table} from "sequelize-typescript";

@Table
export class UsernameModel extends Model{

    @Column({unique: true, allowNull: false})
    public userId: string;

    @Column
    public usernameToPersist: string;

    @Default(false)
    @Column
    public force: boolean

}