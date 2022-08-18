import type {GuildableModel} from "../../guild/Guildable.model.js";
import {Column, Entity, Index, JoinColumn, ManyToOne, OneToMany} from "typeorm";
import {AbstractModel} from "../../AbstractModel.js";
import {ICloseOption} from "../ICloseOption.js";
import {SubModuleModel} from "./subModules/impl/SubModule.model.js";

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

    @ManyToOne("GuildableModel", "closeOptionModel", AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    public guildableModel: GuildableModel;

    @OneToMany(() => SubModuleModel, subModule => subModule.closeOptionModel)
    public subModuleModels: SubModuleModel[];
}
