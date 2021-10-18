import {BelongsTo, Column, DataType, ForeignKey, Model, Table} from "sequelize-typescript";
import {IGuildAware} from "../IGuildAware";
import {GuildableModel} from "./Guildable.model";
import {ArrayUtils, ObjectUtil} from "../../../utils/Utils";
import {Identifiable} from "../Identifiable";

@Table
export class BookmarkModel extends Model implements IGuildAware, Identifiable {

    @Column({unique: false, allowNull: false})
    public userId: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
        get(): string[] {
            const value: string | null = this.getDataValue("messageIds");
            if (!ObjectUtil.validString(value)) {
                return [];
            }
            return this.getDataValue("messageIds").split(",");
        },
        set(messageId: string[]) {
            if (!ArrayUtils.isValidArray(messageId)) {
                this.destroy({
                    force: true
                });
                return;
            }
            this.setDataValue("messageIds", messageId.join(","));
        }
    })
    public messageIds: string[];

    @ForeignKey(() => GuildableModel)
    @Column
    guildId: string;

    @BelongsTo(() => GuildableModel, {onDelete: "cascade"})
    guildableModel: GuildableModel;
}