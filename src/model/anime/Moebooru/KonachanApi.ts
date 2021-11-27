import {singleton} from "tsyringe";
import {Typeings} from "../../types/Typeings";
import {ArrayUtils, ObjectUtil} from "../../../utils/Utils";
import fetch from "node-fetch";
import EXPLICIT_RATING = Typeings.MoebooruTypes.EXPLICIT_RATING;
import KonachanResponse = Typeings.MoebooruTypes.KonachanResponse;

@singleton()
export class KonachanApi {
    private readonly baseUrl = "https://konachan.net/post.json";

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

    public async getPost(tags: string[], explictRating: EXPLICIT_RATING[], returnSize: number = -1): Promise<KonachanResponse> {
        if (!ArrayUtils.isValidArray(tags)) {
            throw new Error("Please supply at least 1 tag");
        }
        const tagsStr = tags.join(" ");
        const url = `${this.baseUrl}?tags=${tagsStr}`;
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

