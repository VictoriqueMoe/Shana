import Fuse from "fuse.js";
import FuseResult = Fuse.FuseResult;

export abstract class SearchBase<T> {
    protected abstract tagCache: Fuse<T>;

    public search(query: string): FuseResult<T>[] {
        if (!this.tagCache) {
            return [];
        }
        return this.tagCache.search(query, {
            limit: 25
        });
    }
}