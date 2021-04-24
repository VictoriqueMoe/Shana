import {AllowNull, BelongsTo, Column, DataType, Default, ForeignKey, Model, Table} from "sequelize-typescript";
import {GuildUtils} from "../../../../utils/Utils";
import {IGuildAware} from "../../IGuildAware";
import {GuildableModel} from "../../guild/Guildable.model";

@Table
export class MuteModel extends Model implements IGuildAware {

    @Column({unique: false, allowNull: false})
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

    @ForeignKey(() => GuildableModel)
    @Column
    guildId: string;

    @BelongsTo(() => GuildableModel, {onDelete: "cascade"})
    guildableModel: GuildableModel;

    public async getPrevRoles(): Promise<string[]> {
        const prevRoles = this.prevRole.split(",");
        const newArr: string[] = [];
        for (const prevRole of prevRoles) {
            if (await GuildUtils.RoleUtils.isValidRole(this.guildId, prevRole)) {
                newArr.push(prevRole);
            }
        }
        return newArr;
    }
}