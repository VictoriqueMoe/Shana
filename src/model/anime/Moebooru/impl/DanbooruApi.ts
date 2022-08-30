import {MoebooruApi} from "../MoebooruApi.js";
import {Typeings} from "../../../Typeings.js";
import {ShanaFuse} from "../../../impl/ShanaFuse.js";
import {AutocompleteInteraction} from "discord.js";
import Fuse from "fuse.js";
import {Property} from "../../../framework/decorators/Property.js";
import {ObjectUtil} from "../../../../utils/Utils.js";
import fetch, {Headers} from "node-fetch";
import DanbooruTag = Typeings.MoebooruTypes.DanbooruTag;
import FuseResult = Fuse.FuseResult;

export class DanbooruApi extends MoebooruApi<DanbooruTag> {

    @Property("DANBOORU_API_KEY")
    private readonly apiKey: string;

    @Property("DANBOORU_API_USER")
    private readonly apiUser: string;

    private readonly auth: string;

    private _tagCache: ShanaFuse<DanbooruTag>;

    public constructor() {
        super();
        this.auth = `Basic ${Buffer.from(`${this.apiUser}:${this.apiKey}`).toString('base64')}`;
    }

    public get enabled(): Promise<boolean> {
        return Promise.resolve(true);
    }

    protected get baseUrl(): string {
        return "https://danbooru.donmai.us";
    }

    protected get fuseCache(): ShanaFuse<DanbooruTag> {
        return null;
    }

    protected set fuseCache(cache: ShanaFuse<DanbooruTag>) {
        this._tagCache = null;
    }

    protected get name(): string {
        return "Danbooru";
    }

    protected get postPage(): string {
        return "posts";
    }

    public override async search(interaction: AutocompleteInteraction): Promise<FuseResult<DanbooruTag>[]> {
        const query = interaction.options.getFocused(true).value as string;
        let url = `${this.baseUrl}/tags.json?limit=25&search[hide_empty]=true&search[order]=count`;
        if (ObjectUtil.validString(query)) {
            url += `&search[name_matches]=${query}*`;
        }
        const headers = new Headers({
            'Authorization': this.auth
        });
        const resultFetch = await fetch(url, {
            method: "GET",
            headers
        });
        if (resultFetch.status !== 200) {
            throw new Error(resultFetch.statusText);
        }
        let json: DanbooruTag[] = await resultFetch.json() as DanbooruTag[];
        json = json.filter(tag => !this.blackList.some(v => tag.name.includes(v)));
        return json.map((value, idx) => {
            return {
                item: value,
                refIndex: idx
            };
        });
    }

    protected update(): Promise<void> {
        return Promise.resolve(null);
    }
}
