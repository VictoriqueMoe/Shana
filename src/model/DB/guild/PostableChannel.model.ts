import {BelongsTo, Column, ForeignKey, Model, Table} from "sequelize-typescript";
import {IGuildAware} from "../IGuildAware";
import {GuildableModel} from "./Guildable.model";

@Table
export class PostableChannelModel extends Model implements IGuildAware {

    @Column({unique: true, defaultValue: null, allowNull: true})
    public logChannel: string;

    @Column({unique: true, defaultValue: null, allowNull: true})
    public AdminLogchannel: string;

    @Column({unique: true, defaultValue: null, allowNull: true})
    public JailChannel: string;

    @ForeignKey(() => GuildableModel)
    @Column
    guildId: string;

    @BelongsTo(() => GuildableModel, {onDelete: "cascade"})
    guildableModel: GuildableModel;
}