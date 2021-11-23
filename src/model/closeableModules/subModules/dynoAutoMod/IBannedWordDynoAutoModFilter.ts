import {IDynoAutoModFilter} from "./IDynoAutoModFilter.js";

export type BannedWordEntries = {
    "exactWord"?: string[],
    "WildCardWords": string[]
}

export interface IBannedWordDynoAutoModFilter extends IDynoAutoModFilter {

    /**
     * Return an object containing the banned words
     */
    readonly bannedWords: BannedWordEntries;
}