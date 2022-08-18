import {singleton} from "tsyringe";
import {RunEvery} from "../../../framework/decorators/RunEvery.js";
import {ShanaFuse} from "../../../impl/ShanaFuse.js";
import {MoebooruApi} from "../MoebooruApi.js";
import {Typeings} from "../../../Typeings.js";
import METHOD_EXECUTOR_TIME_UNIT from "../../../../enums/METHOD_EXECUTOR_TIME_UNIT.js";
import KonachanTag = Typeings.MoebooruTypes.KonachanTag;

@singleton()
export class KonachanApi extends MoebooruApi<KonachanTag> {
    private _tagCache: ShanaFuse<KonachanTag>;

    public get enabled(): Promise<boolean> {
        return Promise.resolve(true);
    }

    protected get baseUrl(): string {
        return "https://konachan.net";
    }

    protected get fuseCache(): ShanaFuse<KonachanTag> {
        return this._tagCache;
    }

    protected set fuseCache(cache: ShanaFuse<KonachanTag>) {
        this._tagCache = cache;
    }

    protected get name(): string {
        return "Konachan";
    }

    @RunEvery(1, METHOD_EXECUTOR_TIME_UNIT.hours, true)
    protected update(): Promise<void> {
        return this.tagUpdater(value => value.count > 0);
    }
}
