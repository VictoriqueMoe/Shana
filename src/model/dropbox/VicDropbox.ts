import {Dropbox, DropboxResponse, files} from "dropbox";
import {singleton} from "tsyringe";
import {Property} from "../decorators/Property";
import {PostConstruct} from "../decorators/PostConstruct";
import {ModelEnabledConfigure} from "../Impl/ModelEnabledConfigure";


class DropBoxProxy extends Dropbox {
    constructor(accessToken: string) {
        super({
            accessToken
        });
    }
}

@singleton()
export class VicDropbox extends ModelEnabledConfigure {
    private imageCache: files.FolderMetadataReference[];

    @Property("dropboxToken", {required: false})
    private readonly dropboxToken: string;

    private _dropbox: Dropbox;

    public constructor() {
        super("dropboxToken");
        this.imageCache = [];
    }

    /**
     * Get all Images from Dropbox
     */
    public get allImages(): files.FolderMetadataReference[] {
        return this.imageCache;
    }

    /**
     * Return a random image from Dropbox
     */
    public get randomImage(): files.FolderMetadataReference {
        return this.imageCache[Math.floor(Math.random() * this.imageCache.length)];
    }

    public async index(): Promise<void> {
        console.log("Indexing images...");
        this.imageCache = ((await this._dropbox.filesListFolder({path: ''})).result.entries) as files.FolderMetadataReference[];
        console.log(`Indexed ${this.imageCache.length} images`);
    }

    async filesDownload(param: { path: string }): Promise<DropboxResponse<files.FileMetadata>> {
        return this._dropbox.filesDownload(param);
    }

    @PostConstruct
    private init(): void {
        if (this.enabled) {
            this._dropbox = new DropBoxProxy(this.dropboxToken);
        }
    }
}
