import Fuse from "fuse.js";
import FuseResult = Fuse.FuseResult;

export abstract class SearchBase<T> {
    protected abstract fuseCache: Fuse<T>;

    public search(query: string): FuseResult<T>[] {
        if (!this.fuseCache) {
            return [];
        }
        return this.fuseCache.search(query, {
            limit: 25
        });
    }
}