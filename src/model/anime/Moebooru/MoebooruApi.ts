import {Typeings} from "../../Typeings.js";
import {ShanaFuse} from "../../impl/ShanaFuse.js";
import {defaultSearch, fuseOptions, ISearchBase} from "../../ISearchBase.js";
import {ObjectUtil} from "../../../utils/Utils.js";
import {AutocompleteInteraction} from "discord.js";
import Fuse from "fuse.js";
import fetch from "node-fetch";
import logger from "../../../utils/LoggerFactory.js";
import MoebooruImage = Typeings.MoebooruTypes.MoebooruImage;
import EXPLICIT_RATING = Typeings.MoebooruTypes.EXPLICIT_RATING;
import MoebooruTag = Typeings.MoebooruTypes.MoebooruTag;
import MoebooruResponse = Typeings.MoebooruTypes.MoebooruResponse;

export type RandomImageResponse = {
    image: MoebooruImage,
    maxPossible: number,
    of: number
}[];

export abstract class MoebooruApi<T extends MoebooruTag> implements ISearchBase<T> {
    public abstract enabled: Promise<boolean>;
    protected abstract baseUrl: string;
    protected abstract name: string;
    protected abstract fuseCache: ShanaFuse<T>;
    protected readonly blackList: string[] = ["nipples", "nude", "pussy", "breasts", "topless", "animal_ears", "catgirl", "bottomless"];

    protected abstract get postPage(): string;

    public async getRandomPosts(tags: string[], explictRating: EXPLICIT_RATING[], returnSize = 1): Promise<RandomImageResponse> {
        const results = await this.getPosts(tags, explictRating);

        if (!ObjectUtil.isValidArray(results)) {
            return [];
        }
        if (returnSize > results.length) {
            returnSize = results.length;
        }
        const retArr: RandomImageResponse = [];
        for (let i = 0; i < returnSize; i++) {
            const of = Math.floor(Math.random() * results.length);
            const randomImage = results[of];
            retArr.push({
                image: randomImage,
                maxPossible: results.length,
                of: of + 1
            });
        }

        return retArr;
    }

    public async getPosts(tags: string[], explictRating: EXPLICIT_RATING[], returnSize = -1): Promise<MoebooruResponse> {
        if (!await this.enabled) {
            return [];
        }
        if (!ObjectUtil.isValidArray(tags)) {
            throw new Error("Please supply at least 1 tag");
        }
        if (this.blackList.some(blackListed => tags.some(tag => tag.includes(blackListed)))) {
            return [];
        }
        const tagsStr = tags.join(" ");
        const url = `${this.baseUrl}/${this.postPage}.json?tags=${tagsStr}`;
        return this.doCall(url, returnSize, explictRating);
    }

    public search(interaction: AutocompleteInteraction): Promise<Fuse.FuseResult<T>[]> {
        return Promise.resolve(defaultSearch(interaction, this.fuseCache));
    }

    protected abstract update(): Promise<void>;

    protected async tagUpdater(filter?: (value: T, index: number, array: MoebooruTag[]) => boolean, limit = 0): Promise<void> {
        if (!await this.enabled) {
            return;
        }
        const tagsSearch = `${this.baseUrl}/tag.json?limit=${limit}&order=name`;
        const result = await fetch(tagsSearch);
        if (result.status !== 200) {
            throw new Error(result.statusText);
        }
        let json: T[] = await result.json() as T[];
        if (filter) {
            json = json.filter(filter);
        }
        json = json.filter(tag => !this.blackList.some(v => tag.name.includes(v)));
        const index = Fuse.createIndex(fuseOptions.keys, json);
        this.fuseCache = new ShanaFuse(json, fuseOptions, index);
        logger.info(`Indexed: ${json.length} tags from ${this.name}`);
    }

    private async doCall(url: string, returnSize: number, explictRating: EXPLICIT_RATING[]): Promise<MoebooruResponse> {
        if (returnSize === -1) {
            returnSize = 500;
        }
        url += `&limit=${returnSize}`;
        const retJson: MoebooruResponse = [];
        let currentPage = 0;
        while (retJson.length !== returnSize) {
            if (currentPage === 0) {
                url += "&page=0";
            }
            url = url.replace(`&page=${currentPage}`, `&page=${++currentPage}`);
            const result = await fetch(url);
            if (result.status !== 200) {
                throw new Error(result.statusText);
            }
            const responseArray: MoebooruResponse = await result.json() as MoebooruResponse;
            if (!ObjectUtil.isValidArray(responseArray)) {
                break;
            }
            for (const jsonResponse of responseArray) {
                if (ObjectUtil.validString(jsonResponse.rating) && explictRating.includes(jsonResponse.rating)) {
                    let tags = jsonResponse.tags;
                    if (ObjectUtil.validString(jsonResponse["tag_string"])) {
                        tags = (jsonResponse["tag_string"] as string);
                    }
                    if (this.blackList.some(v => tags.includes(v))) {
                        continue;
                    }
                    if (retJson.length === returnSize) {
                        break;
                    }
                    retJson.push(jsonResponse);
                }
            }
        }
        return retJson;
    }

}

