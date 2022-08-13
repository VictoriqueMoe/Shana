import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";
import {AbstractEventSecurityConstraint} from "../../../../../AbstractEventSecurityConstraint.js";
import {AbstractModel} from "../../../../../AbstractModel.js";
import {SubModuleModel} from "../SubModule.model.js";
import ACTION from "../../../../../../../../enums/ACTION.js";
import TIME_OUT from "../../../../../../../../enums/TIME_OUT.js";

@Entity()
export class FilterModuleModel extends AbstractEventSecurityConstraint {

    @Column({
        nullable: false
    })
    public pSubModuleId: string;

    @Column({
        enum: ACTION,
        type: "simple-array",
        default: "",
        nullable: false
    })
    public actions: ACTION[];

    @Column({
        default: ""
    })
    public warnMessage: string;

    @Column({
        nullable: false,
        default: 0
    })
    public priority: number;

    @Column({
        nullable: false,
        default: 3
    })
    public autoTerminalViolationCount: number;

    @Column({
        nullable: false,
        default: 15
    })
    public terminalViolationTimeout: number;

    @Column({
        nullable: false,
        default: TIME_OUT["1 hour"] / 1000
    })
    public autoMuteTimeout: number;


    @ManyToOne(() => SubModuleModel, closeOptionModel => closeOptionModel.subModuleId, AbstractModel.cascadeOps)
    @JoinColumn([
        {
            name: AbstractModel.joinCol,
            referencedColumnName: AbstractModel.joinCol
        },
        {
            name: "pSubModuleId",
            referencedColumnName: "subModuleId"
        }
    ])
    public subModule: SubModuleModel;
}
