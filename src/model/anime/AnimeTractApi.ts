import fetch from "node-fetch";
import {encode} from "node-base64-image";
import {Response} from "./AnimeTypings";

export class AnimeTractApi {

    public uris: { search: string; };

    /**
     * Constructs an instance of the API.
     */
    constructor() {
        this.uris = {
            search: `https://trace.moe/api/search`
        };
    }

    /**
     * Searches the website for the similar anime.
     * @param {string} imageURL The URL for the image.
     */
    public async fetchAnime(imageURL: string): Promise<Response> {
        return await fetch("https://trace.moe/api/search", {
            method: "POST",
            body: JSON.stringify({
                image: await this.convertToBase64(imageURL)
            }),
            headers: {"Content-Type": "application/json"}
        })
            .then((res) => res.json());
    }

    /**
     * Returns an URL to an video preview of the similar anime.
     * Use <API>.fetchAnime() to get the needed parameters.
     * @param {number} anilistID The Anilist ID of the similar anime.
     * @param {number} at The "at" value of the similar anime.
     * @param {string} filename The filename of the similar anime.
     * @param {string} tokenthumb The thumbnail token of the similar anime.
     */
    public async fetchPreview(anilistID: number, at: number, filename: string, tokenthumb: string): Promise<Buffer> {
        try {
            const res = await fetch(`https://media.trace.moe/video/${anilistID}/${encodeURIComponent(filename)}?t=${at}&token=${tokenthumb}`, {
                method: "GET"
            });
            return res.buffer();
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    /**
     * Converts/Encode the image to Base64.
     * @param {string} image The image to be converted to Base64.
     */
    private async convertToBase64(image: string): Promise<string | Buffer> {
        return await encode(image, {
            string: true
        });
    }

}
