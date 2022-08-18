import {singleton} from "tsyringe";
import {RunEvery} from "../../../framework/decorators/RunEvery.js";
import {ShanaFuse} from "../../../impl/ShanaFuse.js";
import {MoebooruApi} from "../MoebooruApi.js";
import {Typeings} from "../../../Typeings.js";
import METHOD_EXECUTOR_TIME_UNIT from "../../../../enums/METHOD_EXECUTOR_TIME_UNIT.js";
import LoliBooruTag = Typeings.MoebooruTypes.LoliBooruTag;

@singleton()
export class LolibooruApi extends MoebooruApi<LoliBooruTag> {
    private _tagCache: ShanaFuse<LoliBooruTag>;

    public get enabled(): Promise<boolean> {
        return Promise.resolve(false);
    }

    protected get baseUrl(): string {
        return "https://lolibooru.moe";
    }

    protected get fuseCache(): ShanaFuse<LoliBooruTag> {
        return this._tagCache;
    }

    protected set fuseCache(cache: ShanaFuse<LoliBooruTag>) {
        this._tagCache = cache;
    }

    protected get name(): string {
        return "lolibooru";
    }

    @RunEvery(1, METHOD_EXECUTOR_TIME_UNIT.days, true)
    protected update(): Promise<void> {
        return this.tagUpdater(value => value.post_count > 0, Number.MAX_SAFE_INTEGER);
    }

}
