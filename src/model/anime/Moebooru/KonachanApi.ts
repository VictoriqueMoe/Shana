import {singleton} from "tsyringe";
import {Typeings} from "../../types/Typeings";
import {ArrayUtils} from "../../../utils/Utils";
import fetch from "node-fetch";
import EXPLICIT_RATING = Typeings.MoebooruTypes.EXPLICIT_RATING;
import KonachanResponse = Typeings.MoebooruTypes.KonachanResponse;

@singleton()
export class KonachanApi {
    private readonly baseUrl = "https://konachan.net/post.json";

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
        let currentPage = 0;
        while (retJson.length !== returnSize && ++currentPage) {
            url += `&page=${currentPage}`;
            const result = await fetch(url);
            if (!result.ok) {
                throw new Error(result.statusText);
            }
            const responseArray: KonachanResponse = await result.json();
            if (!ArrayUtils.isValidArray(responseArray)) {
                break;
            }
            let l = responseArray.length;
            while (l--) {
                const responseImage = responseArray[l];
                if (!explictRating.includes(responseImage.rating)) {
                    responseArray.splice(l, 1);
                }
            }
            if (!ArrayUtils.isValidArray(responseArray)) {
                continue;
            }
            retJson.push(...responseArray);
        }
        return retJson;
    }
}

