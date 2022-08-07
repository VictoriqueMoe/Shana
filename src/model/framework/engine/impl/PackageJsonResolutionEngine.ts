import {singleton} from "tsyringe";
import fs from "fs";
import {ObjectUtil} from "../../../../utils/Utils";
import type {IPropertyResolutionEngine, Property} from "../IPropertyResolutionEngine.js";
import {PostConstruct} from "../../decorators/PostConstruct.js";

@singleton()
export class PackageJsonResolutionEngine implements IPropertyResolutionEngine {
    private readonly packageLocation: string = process.env.npm_package_json;
    private packageJson: Record<string, any>;

    public getProperty(prop: string): Property {
        return this.packageJson?.[prop];
    }

    @PostConstruct
    private init(): void {
        if (!ObjectUtil.validString(this.packageLocation)) {
            return;
        }
        const fileByteArray = fs.readFileSync(this.packageLocation, 'utf8');
        this.packageJson = JSON.parse(fileByteArray);
    }

}
