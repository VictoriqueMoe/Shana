import {BelongsTo, Column, ForeignKey, Model, Table} from "sequelize-typescript";
import {ICloseOption} from "../ICloseOption";
import {IGuildAware} from "../../IGuildAware";
import {GuildableModel} from "../../guild/Guildable.model";

@Table
export class CloseOptionModel extends Model implements ICloseOption, IGuildAware {

    @Column({unique: false, allowNull: false})
    public moduleId: string;

    @Column({allowNull: false, defaultValue: false})
    public status: boolean;

    @ForeignKey(() => GuildableModel)
    @Column
    guildId: string;

    @BelongsTo(() => GuildableModel, {onDelete: "cascade"})
    guildableModel: GuildableModel;

}