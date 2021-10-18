import {BelongsTo, Column, DataType, ForeignKey, Model, Table} from "sequelize-typescript";
import {IGuildAware} from "../IGuildAware";
import {GuildableModel} from "./Guildable.model";
import {ArrayUtils, ObjectUtil} from "../../../utils/Utils";

@Table
export class RoleJoinerModel extends Model implements IGuildAware {

    @Column({
        type: DataType.TEXT,
        allowNull: true,
        get(): string[] {
            const value: string | null = this.getDataValue("rolesToJoin");
            if (!ObjectUtil.validString(value)) {
                return [];
            }
            return this.getDataValue("rolesToJoin").split(",");
        },
        set(roles: string[]) {
            if (!ArrayUtils.isValidArray(roles)) {
                this.setDataValue("rolesToJoin", null);
                return;
            }
            this.setDataValue("rolesToJoin", roles.join(","));
        }
    })
    public rolesToJoin: string[];

    @ForeignKey(() => GuildableModel)
    @Column
    guildId: string;

    @BelongsTo(() => GuildableModel, {onDelete: "cascade"})
    guildableModel: GuildableModel;
}