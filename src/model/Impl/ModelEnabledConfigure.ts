import {ObjectUtil} from "../../utils/Utils";

export abstract class ModelEnabledConfigure {
    private readonly _props: string[];

    protected constructor(...props: string[]) {
        this._props = props;
    }

    public get enabled(): boolean {
        for (const prop of this._props) {
            const propValue = this[prop];
            if (typeof propValue === "string") {
                if (!ObjectUtil.validString(propValue)) {
                    return false;
                }
            } else if (!propValue) {
                return false;
            }

        }
        return true;
    }
}
