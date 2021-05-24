const imgur = require('imgur');
const isImageFast = require('is-image-fast');

export class Imgur {
    private readonly clientId = process.env.imgurClientId;
    private readonly albumId = process.env.imgurAlbumId;

    constructor() {
        imgur.setClientId(this.clientId);
        imgur.setCredentials(process.env.imgurEmail, process.env.imgurPassword, this.clientId);
    }

    public async uploadImageFromUrl(url: string): Promise<string> {
        const isImage: boolean = await isImageFast(url);
        if (!isImage) {
            throw new Error("url is not an image");
        }
        return imgur
            .uploadUrl(url, this.albumId)
            .then((json) => {
                return json.link;
            })
            .catch((err) => {
                throw err;
            });
    }

}