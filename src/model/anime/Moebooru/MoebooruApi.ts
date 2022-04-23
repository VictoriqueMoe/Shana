import type {Typeings} from "../../types/Typeings";
import {ArrayUtils, ObjectUtil} from "../../../utils/Utils";
import Fuse from "fuse.js";
import type {ISearchBase} from "../../ISearchBase";
import {defaultSearch, fuseOptions} from "../../ISearchBase";
import type {AutocompleteInteraction} from "discord.js";
import {ShanaFuse} from "../../Impl/ShanaFuse";
import axios from "axios";

export type RandomImageResponse = {
    image: Typeings.MoebooruTypes.MoebooruImage,
    maxPossible: number,
    of: number
}[];

export abstract class MoebooruApi<T extends Typeings.MoebooruTypes.MoebooruTag> implements ISearchBase<T> {
    private readonly blackList: string[] = ["nipples", "nude", "pussy", "breasts", "topless", "animal_ears", "catgirl", "bottomless"];

    protected abstract baseUrl: string;
    protected abstract name: string;
    protected abstract fuseCache: ShanaFuse<T>;

    protected abstract update(): Promise<void>;

    public abstract enabled: Promise<boolean>;


    public async getRandomPosts(tags: string[], explictRating: Typeings.MoebooruTypes.EXPLICIT_RATING[], returnSize: number = 1): Promise<RandomImageResponse> {
        const results = await this.getPosts(tags, explictRating);

        if (!ArrayUtils.isValidArray(results)) {
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

    protected async tagUpdater(filter?: (value: T, index: number, array: Typeings.MoebooruTypes.MoebooruTag[]) => boolean, limit: number = 0): Promise<void> {
        if (!await this.enabled) {
            return;
        }
        const tagsSearch = `${this.baseUrl}/tag.json?limit=${limit}&order=name`;
        const result = await axios.get(tagsSearch);
        if (result.status !== 200) {
            throw new Error(result.statusText);
        }
        let json: T[] = result.data;
        if (filter) {
            json = json.filter(filter);
        }
        json = json.filter(tag => !this.blackList.some(v => tag.name.includes(v)));
        const index = Fuse.createIndex(fuseOptions.keys, json);
        this.fuseCache = new ShanaFuse(json, fuseOptions, index);
        console.log(`Indexed: ${json.length} tags from ${this.name}`);
    }

    private async doCall(url: string, returnSize: number, explictRating: Typeings.MoebooruTypes.EXPLICIT_RATING[]): Promise<Typeings.MoebooruTypes.MoebooruResponse> {
        if (returnSize < 100 && returnSize > 0) {
            url += `&limit=${returnSize}`;
        }
        if (returnSize === -1) {
            returnSize = 500;
        }
        const retJson: Typeings.MoebooruTypes.MoebooruResponse = [];
        let currentPage = 0;
        while (retJson.length !== returnSize) {
            if (currentPage === 0) {
                url += "&page=0";
            }
            url = url.replace(`&page=${currentPage}`, `&page=${++currentPage}`);
            const result = await axios.get(url);
            if (result.status !== 200) {
                throw new Error(result.statusText);
            }
            const responseArray: Typeings.MoebooruTypes.MoebooruResponse = result.data;
            if (!ArrayUtils.isValidArray(responseArray)) {
                break;
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

    public async getPosts(tags: string[], explictRating: Typeings.MoebooruTypes.EXPLICIT_RATING[], returnSize: number = -1): Promise<Typeings.MoebooruTypes.MoebooruResponse> {
        if (!await this.enabled) {
            return [];
        }
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

    public search(interaction: AutocompleteInteraction): Fuse.FuseResult<T>[] {
        return defaultSearch(interaction, this.fuseCache);
    }
}

