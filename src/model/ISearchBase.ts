import Fuse from "fuse.js";
import {ObjectUtil} from "../utils/Utils.js";
import type {ShanaFuse} from "./impl/ShanaFuse.js";
import type {AutocompleteInteraction} from "discord.js";
import FuseResult = Fuse.FuseResult;

export type SearchBase = {
    name: string;
    value: string;
};

/**
 * Fuse default options to comply with ISearchBase
 */
export const fuseOptions = {
    keys: ['name'],
    minMatchCharLength: 0,
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
    search(interaction: AutocompleteInteraction): FuseResult<T>[] | Promise<FuseResult<T>[]>;
}

/**
 * Default search implementation
 * @param interaction
 * @param cache
 */
export function defaultSearch<T extends SearchBase>(interaction: AutocompleteInteraction, cache: ShanaFuse<T>): Fuse.FuseResult<T>[] {
    if (!cache) {
        return [];
    }
    const query = interaction.options.getFocused(true).value as string;
    if (!ObjectUtil.validString(query)) {
        return cache.getFirstNItems(25);
    }
    return cache.search(query, {
        limit: 25
    });
}
