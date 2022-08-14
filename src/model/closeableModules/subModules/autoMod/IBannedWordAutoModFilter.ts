import type {IAutoModFilter} from "./IAutoModFilter.js";

export type BannedWordEntries = {
    "exactWord"?: string[],
    "WildCardWords": string[]
}

export interface IBannedWordAutoModFilter extends IAutoModFilter {

    /**
     * Return an object containing the banned words
     */
    bannedWords(guildId: string): Promise<BannedWordEntries>;
}
