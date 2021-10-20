import {Dropbox, files} from "dropbox";
import {singleton} from "tsyringe";

@singleton()
export class VicDropbox extends Dropbox {
    private imageCache: files.FolderMetadataReference[];

    public constructor(private _dropbox?: Dropbox) {
        super({
            accessToken: process.env.dropboxToken
        });
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
}