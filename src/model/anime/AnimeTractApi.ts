import {singleton} from "tsyringe";
import type {Response} from "./AnimeTypings";
import LoggerFactory from "../../utils/LoggerFactory.js";
import fetch from "node-fetch";

@singleton()
export class AnimeTractApi {

    /**
     * Searches the website for the similar anime.
     * @param {string} imageURL The URL for the image.
     */
    public async fetchAnime(imageURL: string): Promise<Response> {
        const data = await fetch(`https://api.trace.moe/search?url=${encodeURIComponent(`${imageURL}`)}`);
        return (await data.json()) as Response;
    }

    public async fetchPreview(vidUrl: string): Promise<Buffer> {
        try {
            const res = await fetch(`${vidUrl}&size=l`);
            const arrayBuffer = await res.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (e) {
            LoggerFactory.error(e);
            throw e;
        }
    }
}
