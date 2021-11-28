import {Typeings} from "../../types/Typeings";
import {ArrayUtils, ObjectUtil} from "../../../utils/Utils";
import fetch from "node-fetch";
import Fuse from "fuse.js";
import {SearchBase} from "../../Impl/SearchBase";
import EXPLICIT_RATING = Typeings.MoebooruTypes.EXPLICIT_RATING;
import MoebooruTag = Typeings.MoebooruTypes.MoebooruTag;
import MoebooruResponse = Typeings.MoebooruTypes.MoebooruResponse;

export abstract class MoebooruApi<T> extends SearchBase<T> {
    protected abstract baseUrl: string;
    protected abstract name: string;
    private readonly blackList: string[] = ["nipples", "nude", "pussy", "breasts", "topless", "animal_ears", "catgirl", "tail", "bottomless"];

    public async getRandomPosts(tags: string[], explictRating: EXPLICIT_RATING[], returnSize: number = 1): Promise<MoebooruResponse> {
        const results = await this.getPosts(tags, explictRating);

        if (!ArrayUtils.isValidArray(results)) {
            return [];
        }

        const retArr: MoebooruResponse = [];
        for (let i = 0; i < returnSize; i++) {
            const randomImage = results[Math.floor(Math.random() * results.length)];
            retArr.push(randomImage);
        }

        return retArr;
    }

    protected abstract update(): Promise<void>;

    protected async tagUpdater(filter?: (value: T, index: number, array: MoebooruTag[]) => boolean): Promise<void> {
        const options = {
            keys: ['name'],
            minMatchCharLength: 1,
            threshold: 0.3,
            includeScore: true,
            shouldSort: true
        };
        const tagsSearch = `${this.baseUrl}/tag.json?limit=0&order=name`;
        const result = await fetch(tagsSearch);
        if (!result.ok) {
            throw new Error(result.statusText);
        }
        let json: T[] = await result.json();
        if (filter) {
            json = json.filter(filter);
        }
        json = json.filter(tag => !this.blackList.some(v => (tag as any).name.includes(v)));
        const index = Fuse.createIndex(options.keys, json);
        this.tagCache = new Fuse(json, options, index);
        console.log(`Indexed: ${json.length} tags from ${this.name}`);
    }

    protected async doCall(url: string, returnSize: number, explictRating: EXPLICIT_RATING[]): Promise<MoebooruResponse> {
        if (returnSize < 100 && returnSize > 0) {
            url += `&limit=${returnSize}`;
        }
        if (returnSize === -1) {
            returnSize = 500;
        }
        const retJson: MoebooruResponse = [];
        let currentPage = -1;
        while (retJson.length !== returnSize) {
            if (currentPage === -1) {
                url += "&page=-1";
            }
            url = url.replace(`&page=${currentPage}`, `&page=${++currentPage}`);
            const result = await fetch(url);
            if (!result.ok) {
                throw new Error(result.statusText);
            }
            const responseArray: MoebooruResponse = await result.json();
            if (!ArrayUtils.isValidArray(responseArray)) {
                break;
            }
            if (!ArrayUtils.isValidArray(responseArray)) {
                continue;
            }
            for (const jsonResponse of responseArray) {
                if (ObjectUtil.validString(jsonResponse.rating) && explictRating.includes(jsonResponse.rating)) {
                    if (this.blackList.some(v => jsonResponse.tags.includes(v))) {
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

    public async getPosts(tags: string[], explictRating: EXPLICIT_RATING[], returnSize: number = -1): Promise<MoebooruResponse> {
        if (!ArrayUtils.isValidArray(tags)) {
            throw new Error("Please supply at least 1 tag");
        }
        if (this.blackList.some(blackListed => tags.some(tag => tag.includes(blackListed)))) {
            return [];
        }
        const tagsStr = tags.join(" ");
        const url = `${this.baseUrl}/post.json?tags=${tagsStr}`;
        return this.doCall(url, returnSize, explictRating);
    }
}

