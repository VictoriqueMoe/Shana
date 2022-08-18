import {Column, Entity, Index, JoinColumn, ManyToOne, OneToMany} from "typeorm";
import {AbstractModel} from "../../../../AbstractModel.js";
import type {CloseOptionModel} from "../../CloseOption.model.js";
import type {FilterModuleModel} from "./AutoMod/FilterModule.model.js";

@Entity()
@Index("subModuleConstraint", ["guildId", "subModuleId"], {
    unique: true
})
export class SubModuleModel extends AbstractModel {

    @Column({nullable: false})
    public subModuleId: string;

    @Column({unique: false, nullable: false, default: false})
    public isActive: boolean;

    @Column()
    public pModuleId: string;

    @ManyToOne("CloseOptionModel", "subModuleModels", AbstractModel.cascadeOps)
    @JoinColumn([
        {
            name: AbstractModel.joinCol,
            referencedColumnName: AbstractModel.joinCol
        },
        {
            name: "pModuleId",
            referencedColumnName: "moduleId"
        }
    ])
    public closeOptionModel: CloseOptionModel;

    @OneToMany("FilterModuleModel", "subModule")
    public filters: FilterModuleModel[];

}
