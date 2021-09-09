import fetch from "node-fetch";
import {Response} from "./AnimeTypings";

export class AnimeTractApi {

    public uris: { search: string; };

    /**
     * Constructs an instance of the API.
     */
    constructor() {
        this.uris = {
            search: `https://api.trace.moe/search?cutBorders`
        };
    }

    /**
     * Searches the website for the similar anime.
     * @param {string} imageURL The URL for the image.
     */
    public async fetchAnime(imageURL: string): Promise<Response> {
        return fetch(`https://api.trace.moe/search?url=${encodeURIComponent(`${imageURL}`)}`).then((e) => e.json()) as Promise<Response>;
    }

    public async fetchPreview(vidUrl: string): Promise<Buffer> {
        try {
            const res = await fetch(`${vidUrl}&size=l`, {
                method: "GET"
            });
            return res.buffer();
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
}
