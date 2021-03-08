import {IMessageGateKeeperFilter} from "./IMessageGateKeeperFilter";

export type BannedWordEntryies = {
    "exactWord"?: string[],
    "WildCardWords": string[]
}

export interface IBannedWordMessageGateKeeperFilter extends IMessageGateKeeperFilter {

    /**
     * Return an object containing the banned words
     */
    readonly bannedWords: BannedWordEntryies;
}