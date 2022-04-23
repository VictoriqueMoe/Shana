import {MoebooruApi} from "../MoebooruApi";
import {singleton} from "tsyringe";
import {RunEvery} from "../../../decorators/RunEvery";
import {TimeUtils} from "../../../../utils/Utils";
import type {ShanaFuse} from "../../../Impl/ShanaFuse";
import type {Typeings} from "../../../types/Typeings";

@singleton()
export class KonachanApi extends MoebooruApi<Typeings.MoebooruTypes.KonachanTag> {
    private _tagCache: ShanaFuse<Typeings.MoebooruTypes.KonachanTag>;

    protected get baseUrl(): string {
        return "https://konachan.net";
    }

    protected get fuseCache(): ShanaFuse<Typeings.MoebooruTypes.KonachanTag> {
        return this._tagCache;
    }

    protected set fuseCache(cache: ShanaFuse<Typeings.MoebooruTypes.KonachanTag>) {
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
