import {singleton} from "tsyringe";
import {ModuleEnabledConfigure} from "../../impl/ModuleEnabledConfigure.js";
import {Property} from "../decorators/Property.js";
import {PostConstruct} from "../decorators/PostConstruct.js";
import imgur from "imgur";
import isImageFast from 'is-image-fast';

@singleton()
export class ImgurManager extends ModuleEnabledConfigure {

    @Property("IMGUR_CLIENT_ID", false)
    private readonly clientId;

    @Property("IMGUR_ALBUM_ID", false)
    private readonly albumId;

    @Property("IMGUR_EMAIL", false)
    private readonly imgurEmail;

    @Property("IMGUR_PASSWORD", false)
    private readonly imgurPassword;

    public constructor() {
        super("clientId", "albumId", "imgurEmail", "imgurPassword");
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

    @PostConstruct
    private init(): void {
        if (this.enabled) {
            imgur.setClientId(this.clientId);
            imgur.setCredentials(this.imgurEmail, this.imgurPassword, this.clientId);
        }
    }
}
