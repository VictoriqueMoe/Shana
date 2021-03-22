import {BelongsTo, Column, ForeignKey, Model, Table} from "sequelize-typescript";
import {IGuildAware} from "../IGuildAware";
import {GuildableModel} from "./Guildable.model";

@Table
export class PostableChannelModel extends Model implements IGuildAware {

    @Column({unique: true})
    public logChannel: string;

    @Column({unique: true})
    public AdminLogchannel: string;

    @ForeignKey(() => GuildableModel)
    @Column
    guildId: string;

    @BelongsTo(() => GuildableModel, {onDelete: "cascade"})
    guildableModel: GuildableModel;
}