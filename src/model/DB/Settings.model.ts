import {BelongsTo, Column, DataType, ForeignKey, Model, Table} from "sequelize-typescript";
import {IGuildAware} from "./IGuildAware";
import {GuildableModel} from "./guild/Guildable.model";

@Table
export class SettingsModel extends Model implements IGuildAware {

    @Column({unique: false})
    public setting: string;

    @Column(DataType.TEXT)
    public value: string;

    @ForeignKey(() => GuildableModel)
    @Column
    guildId: string;

    @BelongsTo(() => GuildableModel, {onDelete: "cascade"})
    guildableModel: GuildableModel;
}