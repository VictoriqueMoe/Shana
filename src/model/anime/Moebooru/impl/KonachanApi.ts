import {MoebooruApi} from "../MoebooruApi";
import {singleton} from "tsyringe";
import {Typeings} from "../../../types/Typeings";
import Fuse from "fuse.js";
import {RunEvery} from "../../../decorators/RunEvery";
import {TimeUtils} from "../../../../utils/Utils";
import KonachanTag = Typeings.MoebooruTypes.KonachanTag;

@singleton()
export class KonachanApi extends MoebooruApi<KonachanTag> {
    private _tagCache: Fuse<KonachanTag>;

    protected get baseUrl(): string {
        return "https://konachan.net";
    }

    protected get tagCache(): Fuse<KonachanTag> {
        return this._tagCache;
    }

    protected set tagCache(cache: Fuse<KonachanTag>) {
        this._tagCache = cache;
    }

    protected get name(): string {
        return "Konachan";
    }

    @RunEvery(1, TimeUtils.METHOD_EXECUTOR_TIME_UNIT.hours)
    protected update(): Promise<void> {
        return this.tagUpdater(value => value.count > 0);
    }
}