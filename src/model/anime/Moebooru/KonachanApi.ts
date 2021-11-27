import {singleton} from "tsyringe";
import {Typeings} from "../../types/Typeings";
import {ArrayUtils, ObjectUtil, TimeUtils} from "../../../utils/Utils";
import fetch from "node-fetch";
import {RunEvery} from "../../decorators/RunEvery";
import Fuse from "fuse.js";
import {SearchBase} from "../../Impl/SearchBase";
import EXPLICIT_RATING = Typeings.MoebooruTypes.EXPLICIT_RATING;
import KonachanResponse = Typeings.MoebooruTypes.KonachanResponse;
import KonachanTagResponse = Typeings.MoebooruTypes.KonachanTagResponse;
import KonachanTag = Typeings.MoebooruTypes.KonachanTag;

@singleton()
export class KonachanApi extends SearchBase<KonachanTag> {
    private readonly baseUrl = "https://konachan.net";

    public async getRandomPosts(tags: string[], explictRating: EXPLICIT_RATING[], returnSize: number = 1): Promise<KonachanResponse> {
        const results = await this.getPost(tags, explictRating);

        if (!ArrayUtils.isValidArray(results)) {
            return [];
        }

        const retArr: KonachanResponse = [];
        for (let i = 0; i < returnSize; i++) {
            const randomImage = results[Math.floor(Math.random() * results.length)];
            retArr.push(randomImage);
        }

        return retArr;
    }

    @RunEvery(1, TimeUtils.METHOD_EXECUTOR_TIME_UNIT.hours)
    private async tagUpdater(): Promise<void> {
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
        let json: KonachanTagResponse = await result.json();
        json = json.filter(value => value.count > 0);
        console.log(`Indexed: ${json.length} tags from Konachan`);
        this.tagCache = new Fuse(json, options);
    }

    public async getPost(tags: string[], explictRating: EXPLICIT_RATING[], returnSize: number = -1): Promise<KonachanResponse> {
        if (!ArrayUtils.isValidArray(tags)) {
            throw new Error("Please supply at least 1 tag");
        }
        const tagsStr = tags.join(" ");
        const url = `${this.baseUrl}/post.json?tags=${tagsStr}`;
        return this.doCall(url, returnSize, explictRating);
    }

    private async doCall(url: string, returnSize: number, explictRating: EXPLICIT_RATING[]): Promise<KonachanResponse> {
        if (returnSize < 100 && returnSize > 0) {
            url += `&limit=${returnSize}`;
        }
        if (returnSize === -1) {
            returnSize = 500;
        }
        const retJson: KonachanResponse = [];
        let currentPage = -1;
        while (retJson.length !== returnSize) {
            url += `&page=${++currentPage}`;
            const result = await fetch(url);
            if (!result.ok) {
                throw new Error(result.statusText);
            }
            const responseArray: KonachanResponse = await result.json();
            if (!ArrayUtils.isValidArray(responseArray)) {
                break;
            }
            if (!ArrayUtils.isValidArray(responseArray)) {
                continue;
            }
            for (const jsonResponse of responseArray) {
                if (ObjectUtil.validString(jsonResponse.rating) && explictRating.includes(jsonResponse.rating)) {
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

