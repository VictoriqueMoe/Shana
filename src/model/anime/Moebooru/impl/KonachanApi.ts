import {MoebooruApi} from "../MoebooruApi";
import {singleton} from "tsyringe";
import {Typeings} from "../../../types/Typeings";
import {RunEvery} from "../../../decorators/RunEvery";
import {TimeUtils} from "../../../../utils/Utils";
import {ShanaFuse} from "../../../Impl/ShanaFuse";
import KonachanTag = Typeings.MoebooruTypes.KonachanTag;

@singleton()
export class KonachanApi extends MoebooruApi<KonachanTag> {
    private _tagCache: ShanaFuse<KonachanTag>;

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

    public get enabled(): Promise<boolean> {
        return Promise.resolve(true);
    }

    @RunEvery(1, TimeUtils.METHOD_EXECUTOR_TIME_UNIT.hours)
    protected update(): Promise<void> {
        return this.tagUpdater(value => value.count > 0);
    }
}