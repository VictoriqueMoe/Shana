import {singleton} from "tsyringe";
import {Dropbox, DropboxResponse, files} from "dropbox";
import {ShanaFuse} from "../../impl/ShanaFuse.js";
import {defaultSearch, fuseOptions, ISearchBase} from "../../ISearchBase.js";
import {ModuleEnabledConfigure} from "../../impl/ModuleEnabledConfigure.js";
import {Property} from "../decorators/Property.js";
import {PostConstruct} from "../decorators/PostConstruct.js";
import {AutocompleteInteraction} from "discord.js";
import Fuse from "fuse.js";
import FuseResult = Fuse.FuseResult;


class DropBoxProxy extends Dropbox {
    public constructor(accessToken: string) {
        super({
            accessToken
        });
    }
}

@singleton()
export class VicDropbox extends ModuleEnabledConfigure implements ISearchBase<files.FolderMetadataReference> {
    private _imageCache: files.FolderMetadataReference[];

    private _fuseCache: ShanaFuse<files.FolderMetadataReference>;

    @Property("DROPBOX_TOKEN", false)
    private readonly dropboxToken: string;

    private _dropbox: Dropbox;

    public constructor() {
        super("dropboxToken");
        this._imageCache = [];
        this._fuseCache = null;
    }

    /**
     * Get all Images from Dropbox
     */
    public get allImages(): files.FolderMetadataReference[] {
        return this._imageCache;
    }

    /**
     * Return a random image from Dropbox
     */
    public get randomImage(): files.FolderMetadataReference {
        return this._imageCache[Math.floor(Math.random() * this._imageCache.length)];
    }

    public getImageFromFileName(fileName: string): files.FolderMetadataReference | null {
        return this._imageCache.find(image => image.name === fileName) ?? null;
    }

    public async index(): Promise<void> {
        console.log("Indexing images...");
        this._imageCache = ((await this._dropbox.filesListFolder({path: ''})).result.entries) as files.FolderMetadataReference[];
        this._fuseCache = new ShanaFuse(this._imageCache, fuseOptions);
        console.log(`Indexed ${this._imageCache.length} images`);
    }

    public filesDownload(param: { path: string }): Promise<DropboxResponse<files.FileMetadata>> {
        return this._dropbox.filesDownload(param);
    }

    public search(interaction: AutocompleteInteraction): FuseResult<files.FolderMetadataReference>[] {
        return defaultSearch(interaction, this._fuseCache);
    }

    @PostConstruct
    private init(): void {
        if (this.enabled) {
            this._dropbox = new DropBoxProxy(this.dropboxToken);
            this.index();
        }
    }
}
