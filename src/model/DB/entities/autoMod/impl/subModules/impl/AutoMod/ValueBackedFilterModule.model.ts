import {FilterModuleModel} from "./FilterModule.model.js";
import {Column, Entity} from "typeorm";

@Entity()
export class ValueBackedFilterModuleModel extends FilterModuleModel {

    @Column({
        type: "text",
        unique: true,
        default: null,
        nullable: true
    })
    public value: string;

}
