import {GuildableModel} from "../../guild/Guildable.model.js";
import typeorm from "typeorm";
const { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } = typeorm;
import {AbstractModel} from "../../AbstractModel.js";
import {ICloseOption} from "../ICloseOption.js";
import {SubModuleModel} from "./EventModules/subModules/impl/SubModule.model.js";

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
        nullable: false,
        default: false
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

    @OneToMany(() => SubModuleModel, subModule => subModule.closeOptionModel)
    public subModuleModels: SubModuleModel[];
}