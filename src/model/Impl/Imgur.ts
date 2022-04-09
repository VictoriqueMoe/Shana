import {Property} from "../decorators/Property";
import {singleton} from "tsyringe";
import {ModuleEnabledConfigure} from "./ModuleEnabledConfigure";
import {PostConstruct} from "../decorators/PostConstruct";

const imgur = require('imgur');
const isImageFast = require('is-image-fast');

@singleton()
export class Imgur extends ModuleEnabledConfigure {

    @Property("imgurClientId", false)
    private readonly clientId;

    @Property("imgurAlbumId", false)
    private readonly albumId;

    @Property("imgurEmail", false)
    private readonly imgurEmail;

    @Property("imgurPassword", false)
    private readonly imgurPassword;

    public constructor() {
        super("clientId", "albumId", "imgurEmail", "imgurPassword");
    }

    @PostConstruct
    private init(): void {
        if (this.enabled) {
            imgur.setClientId(this.clientId);
            imgur.setCredentials(this.imgurEmail, this.imgurPassword, this.clientId);
        }
    }

    public async uploadImageFromUrl(url: string): Promise<string> {
        if (!this.enabled) {
            throw new Error("Module not enabled");
        }
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
