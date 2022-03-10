import {singleton} from "tsyringe";
import {IPropertyResolutionEngine, Property} from "../IPropertyResolutionEngine";
import fs from "fs";
import {PostConstruct} from "../../decorators/PostConstruct";
import {ObjectUtil} from "../../../utils/Utils";

@singleton()
export class PackageJsonResolutionEngine implements IPropertyResolutionEngine {
    private readonly packageLocation: string = process.env.npm_package_json;
    private packageJson: Record<string, any>;

    public getProperty(prop: string): Property {
        return this.packageJson?.[prop];
    }

    @PostConstruct
    private init(): void {
        console.log(process.env);
        if (!ObjectUtil.validString(this.packageLocation)) {
            return;
        }
        const fileByteArray = fs.readFileSync(this.packageLocation, 'utf8');
        this.packageJson = JSON.parse(fileByteArray);
    }

}
