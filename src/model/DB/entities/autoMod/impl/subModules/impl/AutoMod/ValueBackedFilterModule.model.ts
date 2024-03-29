import {FilterModuleModel} from "./FilterModule.model.js";
import {Column, Entity} from "typeorm";
import type {
    ValueBackedFilterSettings
} from "../../../../../../../closeableModules/subModules/autoMod/filters/IValueBackedAutoModFilter.js";

@Entity()
export class ValueBackedFilterModuleModel extends FilterModuleModel {

    @Column({
        type: "text",
        unique: false,
        default: null,
        nullable: true
    })
    public value: string;

    public override getSettings(): ValueBackedFilterSettings {
        const filterSettings = super.getSettings();
        return {
            value: this.value,
            ...filterSettings
        };
    }

}
