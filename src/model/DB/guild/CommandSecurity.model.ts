import {BelongsTo, Column, DataType, ForeignKey, Model, Table} from "sequelize-typescript";
import {IGuildAware} from "../IGuildAware";
import {GuildableModel} from "./Guildable.model";
import {ArrayUtils, ObjectUtil} from "../../../utils/Utils";

@Table
export class CommandSecurityModel extends Model implements IGuildAware {

    @Column({unique: true, allowNull: false})
    public commandName: string;

    @Column({
        type: DataType.TEXT,
        allowNull: true,
        get(): string[] {
            const value: string | null = this.getDataValue("allowedRoles");
            if (!ObjectUtil.validString(value)) {
                return [];
            }
            return this.getDataValue("allowedRoles").split(",");
        },
        set(roles: string[]) {
            if (!ArrayUtils.isValidArray(roles)) {
                this.setDataValue("allowedRoles", null);
                return;
            }
            this.setDataValue("allowedRoles", roles.join(","));
        }
    })
    public allowedRoles: string[];

    @ForeignKey(() => GuildableModel)
    @Column
    guildId: string;

    @BelongsTo(() => GuildableModel, {onDelete: "cascade"})
    guildableModel: GuildableModel;
}