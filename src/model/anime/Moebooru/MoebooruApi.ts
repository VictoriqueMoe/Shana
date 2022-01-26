import {Typeings} from "../../types/Typeings";
import {ArrayUtils, ObjectUtil} from "../../../utils/Utils";
import Fuse from "fuse.js";
import {defaultSearch, ISearchBase, options} from "../../ISearchBase";
import {AutocompleteInteraction} from "discord.js";
import {ShanaFuse} from "../../Impl/ShanaFuse";
import axios from "axios";
import EXPLICIT_RATING = Typeings.MoebooruTypes.EXPLICIT_RATING;
import MoebooruTag = Typeings.MoebooruTypes.MoebooruTag;
import MoebooruResponse = Typeings.MoebooruTypes.MoebooruResponse;
import MoebooruImage = Typeings.MoebooruTypes.MoebooruImage;

export type RandomImageResponse = {
    image: MoebooruImage,
    maxPossible: number,
    of: number
}[];

export abstract class MoebooruApi<T extends MoebooruTag> implements ISearchBase<T> {
    protected abstract baseUrl: string;
    protected abstract name: string;
    private readonly blackList: string[] = ["nipples", "nude", "pussy", "breasts", "topless", "animal_ears", "catgirl", "tail", "bottomless"];
    protected abstract fuseCache: ShanaFuse<T>;
    public abstract enabled: Promise<boolean>;

    public async getRandomPosts(tags: string[], explictRating: EXPLICIT_RATING[], returnSize: number = 1): Promise<RandomImageResponse> {
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

    protected abstract update(): Promise<void>;

    protected async tagUpdater(filter?: (value: T, index: number, array: MoebooruTag[]) => boolean): Promise<void> {
        if (!await this.enabled) {
            return;
        }
        const tagsSearch = `${this.baseUrl}/tag.json?limit=0&order=name`;
        const result = await axios.get(tagsSearch);
        if (result.status !== 200) {
            throw new Error(result.statusText);
        }
        let json: T[] = result.data;
        if (filter) {
            json = json.filter(filter);
        }
        json = json.filter(tag => !this.blackList.some(v => tag.name.includes(v)));
        const index = Fuse.createIndex(options.keys, json);
        this.fuseCache = new ShanaFuse(json, options, index);
        console.log(`Indexed: ${json.length} tags from ${this.name}`);
    }

    private async doCall(url: string, returnSize: number, explictRating: EXPLICIT_RATING[]): Promise<MoebooruResponse> {
        if (returnSize < 100 && returnSize > 0) {
            url += `&limit=${returnSize}`;
        }
        if (returnSize === -1) {
            returnSize = 500;
        }
        const retJson: MoebooruResponse = [];
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
            const responseArray: MoebooruResponse = result.data;
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

