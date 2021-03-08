import {IDynoAutoModFilter} from "./IDynoAutoModFilter";

export type BannedWordEntryies = {
    "exactWord"?: string[],
    "WildCardWords": string[]
}

export interface IBannedWordDynoAutoModFilter extends IDynoAutoModFilter {

    /**
     * Return an object containing the banned words
     */
    readonly bannedWords: BannedWordEntryies;
}