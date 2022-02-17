import {MoebooruApi} from "../MoebooruApi";
import {RunEvery} from "../../../decorators/RunEvery";
import {TimeUtils} from "../../../../utils/Utils";
import {Typeings} from "../../../types/Typeings";
import {singleton} from "tsyringe";
import {ShanaFuse} from "../../../Impl/ShanaFuse";
import LoliBooruTag = Typeings.MoebooruTypes.LoliBooruTag;

@singleton()
export class LolibooruApi extends MoebooruApi<LoliBooruTag> {
    private _tagCache: ShanaFuse<LoliBooruTag>;

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

    public get enabled(): Promise<boolean> {
        return Promise.resolve(true);
    }

    @RunEvery(1, TimeUtils.METHOD_EXECUTOR_TIME_UNIT.days)
    protected update(): Promise<void> {
        return this.tagUpdater(value => value.post_count > 0, Number.MAX_SAFE_INTEGER);
    }

}