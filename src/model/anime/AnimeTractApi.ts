import {singleton} from "tsyringe";
import axios from "axios";
import type {Response} from "./AnimeTypings";
import LoggerFactory from "../../utils/LoggerFactory.js";

@singleton()
export class AnimeTractApi {

    /**
     * Searches the website for the similar anime.
     * @param {string} imageURL The URL for the image.
     */
    public async fetchAnime(imageURL: string): Promise<Response> {
        return axios.get(`https://api.trace.moe/search?url=${encodeURIComponent(`${imageURL}`)}`).then(e => e.data);
    }

    public async fetchPreview(vidUrl: string): Promise<Buffer> {
        try {
            const res = await axios.get(`${vidUrl}&size=l`, {
                responseType: "arraybuffer"
            });
            return res.data;
        } catch (e) {
            LoggerFactory.error(e);
            throw e;
        }
    }
}
