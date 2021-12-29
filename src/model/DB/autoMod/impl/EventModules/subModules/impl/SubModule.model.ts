import {Column, Entity, Index, JoinColumn, ManyToOne} from "typeorm";
import {CloseOptionModel} from "../../../CloseOption.model";
import {AbstractModel} from "../../../../../AbstractModel";

@Entity()
@Index("subModuleConstraint", ["pModuleId", "guildId", "subModuleId"], {
    unique: true
})
export class SubModuleModel extends AbstractModel {

    @Column({nullable: false})
    public subModuleId: string;

    @Column({unique: false, nullable: false, default: false})
    public isActive: boolean;

    @Column()
    pModuleId: string;

    @ManyToOne(() => CloseOptionModel, closeOptionModel => closeOptionModel.subModuleModels, AbstractModel.cascadeOps)
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
    closeOptionModel: CloseOptionModel;

}