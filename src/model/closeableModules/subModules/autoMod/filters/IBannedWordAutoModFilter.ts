import type {FilterSettings, IAutoModFilter} from "./IAutoModFilter.js";

export type BannedWordEntries = {
    "exactWord"?: string[],
    "wildCardWords": string[]
}

export type BannedWordFilterSettings = FilterSettings & {
    bannedWords?: BannedWordEntries
};

export interface IBannedWordAutoModFilter extends IAutoModFilter {

    /**
     * Return an object containing the banned words
     */
    bannedWords(guildId: string): Promise<BannedWordEntries>;
}
