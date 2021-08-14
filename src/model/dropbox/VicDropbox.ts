import {files} from "dropbox";
import {Main} from "../../Main";

export class VicDropbox {
    private isIndexed = false;
    private imageCache: files.FolderMetadataReference[];

    private constructor() {
        this.imageCache = [];
        this.isIndexed = false;
        const handler = {
            get(target, propKey, receiver) {
                if (typeof target[propKey] === 'function') {
                    return new Proxy(target[propKey], {
                        apply(applyTarget, thisArg, args) {
                            const isIndexed = target.isIndexed;
                            const isIndexMethod = applyTarget.name === "index";
                            if (!isIndexMethod && !isIndexed) {
                                throw new Error("Index must be called before using this class");
                            }
                            return Reflect.apply(applyTarget, thisArg, args);
                        }
                    });
                }
                return target[propKey];
            }
        };
        return new Proxy(this, handler);
    }

    private static _instance: VicDropbox;

    public static get instance(): VicDropbox {
        if (!VicDropbox._instance) {
            VicDropbox._instance = new VicDropbox();
        }

        return VicDropbox._instance;
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
        this.imageCache = ((await Main.dropBox.filesListFolder({path: ''})).result.entries) as files.FolderMetadataReference[];
        console.log(`Indexed ${this.imageCache.length} images`);
        this.isIndexed = true;
    }
}