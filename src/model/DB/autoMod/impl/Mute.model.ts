import {AllowNull, Column, DataType, Default, Model, Table} from "sequelize-typescript";
import {Roles} from "../../../../enums/Roles";
import {EnumEx} from "../../../../utils/Utils";
import RolesEnum = Roles.RolesEnum;

@Table
export class MuteModel extends Model {

    @Column({unique: true, allowNull: false})
    public userId: string;

    @Column
    public prevRole: string;

    @Column({allowNull: false})
    public username: string;

    @Column(DataType.TEXT)
    public reason: string;

    @Column
    public creatorID: string;

    @AllowNull(false)
    @Default(0)
    @Column(DataType.INTEGER)
    public violationRules: number;

    @AllowNull(true)
    @Column(DataType.INTEGER)
    public timeout: number;

    public getPrevRoles(): RolesEnum[] {
        return this.prevRole.split(",").filter(r => r !== RolesEnum.EVERYONE).map(r => EnumEx.loopBack(RolesEnum, r, true));
    }
}