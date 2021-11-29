import Fuse from "fuse.js";
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
    shouldSort: true
};

export interface ISearchBase<T extends SearchBase> {
    /**
     * Preform a search on the Fuse container
     * @param query
     */
    search(query: string): FuseResult<T>[];
}

/**
 * Default search implementation
 * @param query
 * @param cache
 */
export function defaultSearch<T extends SearchBase>(query: string, cache: Fuse<T>): Fuse.FuseResult<T>[] {
    if (!cache) {
        return [];
    }
    return cache.search(query, {
        limit: 25
    });
}