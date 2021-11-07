import {GuildableModel} from "../../guild/Guildable.model";
import {Column, Entity, Index, JoinColumn, ManyToOne} from "typeorm";
import {AbstractModel} from "../../AbstractModel";
import {ICloseOption} from "../ICloseOption";

@Entity()
@Index("uniqueConstraint", ["moduleId", "guildId"], {
    unique: true
})
export class CloseOptionModel extends AbstractModel implements ICloseOption {

    @Column({
        nullable: false
    })
    public moduleId: string;

    @Column({
        nullable: false
    })
    public status: boolean;

    @Column({
        nullable: true,
        default: null,
        type: "simple-json",
    })
    public settings: Record<string, unknown>;

    @ManyToOne(() => GuildableModel, guildableModel => guildableModel.closeOptionModel, AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    guildableModel: GuildableModel;
}