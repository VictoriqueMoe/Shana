import {MoebooruApi} from "../MoebooruApi";
import {RunEvery} from "../../../decorators/RunEvery";
import {TimeUtils} from "../../../../utils/Utils";
import type {Typeings} from "../../../types/Typeings";
import {singleton} from "tsyringe";
import type {ShanaFuse} from "../../../Impl/ShanaFuse";

@singleton()
export class LolibooruApi extends MoebooruApi<Typeings.MoebooruTypes.LoliBooruTag> {
    private _tagCache: ShanaFuse<Typeings.MoebooruTypes.LoliBooruTag>;

    protected get baseUrl(): string {
        return "https://lolibooru.moe";
    }

    protected get fuseCache(): ShanaFuse<Typeings.MoebooruTypes.LoliBooruTag> {
        return this._tagCache;
    }

    protected set fuseCache(cache: ShanaFuse<Typeings.MoebooruTypes.LoliBooruTag>) {
        this._tagCache = cache;
    }

    protected get name(): string {
        return "lolibooru";
    }

    public get enabled(): Promise<boolean> {
        return Promise.resolve(true);
    }

    @RunEvery(1, TimeUtils.METHOD_EXECUTOR_TIME_UNIT.days)
    protected update(): Promise<void> {
        return this.tagUpdater(value => value.post_count > 0, Number.MAX_SAFE_INTEGER);
    }

}
