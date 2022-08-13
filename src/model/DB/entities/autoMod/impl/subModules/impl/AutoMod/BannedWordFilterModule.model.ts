import {FilterModuleModel} from "./FilterModule.model.js";
import {Column, Entity} from "typeorm";
import type {
    BannedWordEntries
} from "../../../../../../../closeableModules/subModules/autoMod/IBannedWordAutoModFilter.js";


@Entity()
export class BannedWordFilterModuleModel extends FilterModuleModel {

    @Column({
        type: "simple-json",
        default: null,
        nullable: true
    })
    public bannedWords: BannedWordEntries;

}
