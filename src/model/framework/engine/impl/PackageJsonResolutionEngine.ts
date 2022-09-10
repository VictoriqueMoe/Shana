import fs from "fs";
import {ObjectUtil} from "../../../../utils/Utils.js";
import type {IPropertyResolutionEngine} from "../IPropertyResolutionEngine.js";
import {PropertyTYpe} from "../IPropertyResolutionEngine.js";
import {PostConstruct} from "../../decorators/PostConstruct.js";

export class PackageJsonResolutionEngine implements IPropertyResolutionEngine {
    private readonly packageLocation: string = process.env.npm_package_json;
    private packageJson: Record<string, any>;

    public getProperty(prop: string): PropertyTYpe {
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
