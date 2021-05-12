import {Model, Table} from "sequelize-typescript";

@Table
export class SubModuleModel extends Model {

    /*    @Column({unique: "guildConstraint", allowNull: false})
        public subMuldeId: string;

        @Column({unique: false, allowNull: false, defaultValue: false})
        public isActive: boolean;

        @ForeignKey(() => GuildableModel)
        @Column({unique: "guildConstraint"})
        guildId: string;

        @ForeignKey(() => CloseOptionModel)
        @Column({unique: "guildConstraint"})
        pModuleId: string;

        @BelongsTo(() => CloseOptionModel, {onDelete: "cascade", targetKey: "moduleId"})
        closeOptionModel: CloseOptionModel;

        @BelongsTo(() => GuildableModel, {onDelete: "cascade", targetKey: "guildId"})
        guildableModel: GuildableModel;*/

}