import {WeebBot} from "../../discord/WeebBot";
import {files} from "dropbox";
import * as _ from "lodash";

export class VicDropbox {
    private static _instance: VicDropbox;
    private isIndexed: boolean = false;
    private imageCache: files.FolderMetadataReference[];

    private constructor() {
        this.imageCache = [];
        this.isIndexed = false;
        let handler = {
            get(target, propKey, receiver) {
                if (typeof target[propKey] === 'function') {
                    return new Proxy(target[propKey], {
                        apply(applyTarget, thisArg, args) {
                            let isIndexed = target.isIndexed;
                            let isIndexMethod = applyTarget.name === "index";
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
        return _.sampleSize(this.imageCache)[0];
    }

    public async index(): Promise<void> {
        console.log("Indexing images...");
        this.imageCache = ((await WeebBot.dropBox.filesListFolder({path: ''})).result.entries) as files.FolderMetadataReference[];
        console.log(`Indexed ${this.imageCache.length} images`);
        this.isIndexed = true;
    }
}