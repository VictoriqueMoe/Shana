import Fuse from "fuse.js";
import {AutocompleteInteraction} from "discord.js";
import {ObjectUtil} from "../utils/Utils";
import FuseResult = Fuse.FuseResult;

export type SearchBase = {
    name: string
}

/**
 * Fuse default options to comply with ISearchBase
 */
export const options = {
    keys: ['name'],
    minMatchCharLength: 1,
    threshold: 0.3,
    includeScore: true,
    useExtendedSearch: true,
    shouldSort: true
};

export interface ISearchBase<T extends SearchBase> {
    /**
     * Preform a search on the Fuse container
     * @param interaction
     */
    search(interaction: AutocompleteInteraction): FuseResult<T>[];
}

/**
 * Default search implementation
 * @param interaction
 * @param cache
 */
export function defaultSearch<T extends SearchBase>(interaction: AutocompleteInteraction, cache: Fuse<T>): Fuse.FuseResult<T>[] {
    if (!cache) {
        return [];
    }
    let query = interaction.options.getFocused(true).value as string;
    if (!ObjectUtil.validString(query)) {
        query = "a";
    }
    return cache.search(query, {
        limit: 25
    });
}