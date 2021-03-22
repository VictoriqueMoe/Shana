import {BelongsTo, Column, ForeignKey, Model, Table} from "sequelize-typescript";
import {Identifiable} from "../../Identifiable";
import {IGuildAware} from "../../IGuildAware";
import {GuildableModel} from "../../guild/Guildable.model";

@Table
export class RolePersistenceModel extends Model implements Identifiable, IGuildAware {

    @Column({unique: true, allowNull: false})
    public userId: string;

    @Column
    public roleId: string;

    @ForeignKey(() => GuildableModel)
    @Column
    guildId: string;

    @BelongsTo(() => GuildableModel, {onDelete: "cascade"})
    guildableModel: GuildableModel;
}