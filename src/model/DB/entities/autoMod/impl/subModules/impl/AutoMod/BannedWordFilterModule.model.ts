import {FilterModuleModel} from "./FilterModule.model.js";
import {Column, Entity} from "typeorm";
import type {
    BannedWordEntries,
    BannedWordFilterSettings
} from "../../../../../../../closeableModules/subModules/autoMod/filters/IBannedWordAutoModFilter.js";


@Entity()
export class BannedWordFilterModuleModel extends FilterModuleModel {

    @Column({
        type: "simple-json",
        default: JSON.stringify({
            "exactWord": [],
            "wildCardWords": []
        }),
        nullable: true
    })
    public bannedWords: BannedWordEntries;

    public override getSettings(): BannedWordFilterSettings {
        const filterSettings = super.getSettings();
        return {
            bannedWords: this.bannedWords,
            ...filterSettings
        };
    }

}
