import {Column, Entity, Index, JoinColumn, ManyToOne} from "typeorm";
import {AbstractEventSecurityConstraint} from "../../../../../AbstractEventSecurityConstraint.js";
import ACTION from "../../../../../../../../enums/ACTION.js";
import TIME_OUT from "../../../../../../../../enums/TIME_OUT.js";
import {SubModuleModel} from "../SubModule.model.js";
import {AbstractModel} from "../../../../../AbstractModel.js";
import type {FilterSettings} from "../../../../../../../closeableModules/subModules/autoMod/IAutoModFilter.js";

@Entity()
@Index(["guildId", "pSubModuleId"], {
    unique: true
})
export class FilterModuleModel extends AbstractEventSecurityConstraint {

    @Column({
        nullable: false
    })
    public pSubModuleId: string;

    @Column({
        type: "simple-array",
        default: [ACTION.NONE],
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

    @ManyToOne("SubModuleModel", "filters", AbstractModel.cascadeOps)
    @JoinColumn(
        [
            {
                name: "pSubModuleId",
                referencedColumnName: "subModuleId"
            },
            {
                name: AbstractModel.joinCol,
                referencedColumnName: AbstractModel.joinCol
            }
        ]
    )
    public subModule: SubModuleModel;

    public getSettings(): FilterSettings {
        return {
            actions: this.actions,
            autoMuteTimeout: this.autoMuteTimeout,
            id: this.pSubModuleId,
            priority: this.priority,
            autoTerminalViolationCount: this.autoTerminalViolationCount,
            isActive: this.subModule.isActive ?? false,
            terminalViolationTimeout: this.terminalViolationTimeout,
            warnMessage: this.warnMessage
        };
    }
}
