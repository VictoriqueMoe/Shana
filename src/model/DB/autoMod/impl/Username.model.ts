import {BelongsTo, Column, Default, ForeignKey, Model, Table} from "sequelize-typescript";
import {GuildableModel} from "../../guild/Guildable.model";
import {IGuildAware} from "../../IGuildAware";
import {Identifiable} from "../../Identifiable";

@Table
export class UsernameModel extends Model implements IGuildAware, Identifiable {

    @Column({unique: false, allowNull: false})
    public userId: string;

    @Column
    public usernameToPersist: string;

    @Default(false)
    @Column
    public force: boolean;

    @ForeignKey(() => GuildableModel)
    @Column
    guildId: string;

    @BelongsTo(() => GuildableModel, {onDelete: "cascade"})
    guildableModel: GuildableModel;

}