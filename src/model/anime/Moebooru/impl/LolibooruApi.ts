import {MoebooruApi} from "../MoebooruApi";
import Fuse from "fuse.js";
import {RunEvery} from "../../../decorators/RunEvery";
import {TimeUtils} from "../../../../utils/Utils";
import {Typeings} from "../../../types/Typeings";
import {singleton} from "tsyringe";
import LoliBooruTag = Typeings.MoebooruTypes.LoliBooruTag;

@singleton()
export class LolibooruApi extends MoebooruApi<LoliBooruTag> {
    private _tagCache: Fuse<LoliBooruTag>;

    protected get baseUrl(): string {
        return "https://lolibooru.moe";
    }

    protected get tagCache(): Fuse<LoliBooruTag> {
        return this._tagCache;
    }

    protected set tagCache(cache: Fuse<LoliBooruTag>) {
        this._tagCache = cache;
    }

    protected get name(): string {
        return "lolibooru";
    }

    @RunEvery(1, TimeUtils.METHOD_EXECUTOR_TIME_UNIT.hours)
    protected update(): Promise<void> {
        return this.tagUpdater(value => value.post_count > 0);
    }
}