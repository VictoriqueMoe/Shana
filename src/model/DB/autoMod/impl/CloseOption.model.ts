import {BelongsTo, Column, DataType, ForeignKey, Model, Table} from "sequelize-typescript";
import {ICloseOption} from "../ICloseOption";
import {IGuildAware} from "../../IGuildAware";
import {GuildableModel} from "../../guild/Guildable.model";
import {ObjectUtil} from "../../../../utils/Utils";

@Table
export class CloseOptionModel extends Model implements ICloseOption, IGuildAware {

    @Column({unique: "uniqueConstraint", allowNull: false})
    public moduleId: string;

    @Column({allowNull: false, defaultValue: false})
    public status: boolean;

    @Column({
        allowNull: true,
        defaultValue: null,
        type: DataType.TEXT,
        get(): Record<string, unknown> {
            const value: string | null = this.getDataValue("settings");
            if (!ObjectUtil.validString(value)) {
                return null;
            }
            return JSON.parse(value);
        },
        set(settings: Record<string, unknown>) {
            if (!ObjectUtil.isValidObject(settings)) {
                this.setDataValue("settings", null);
                return;
            }
            this.setDataValue("settings", JSON.stringify(settings));
        }
    })
    public settings: Record<string, unknown>;

    @ForeignKey(() => GuildableModel)
    @Column({unique: "uniqueConstraint"})
    guildId: string;

    @BelongsTo(() => GuildableModel, {onDelete: "cascade"})
    guildableModel: GuildableModel;


    /*@HasMany(() => SubModuleModel, {onDelete: "cascade", foreignKey: "moduleId"})
    public submodules: SubModuleModel[];*/
}