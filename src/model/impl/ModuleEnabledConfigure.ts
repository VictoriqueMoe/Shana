import {ObjectUtil} from "../../utils/Utils.js";

/**
 * Sometimes components can not function without props retrieved from `@Property`. this class defines if a service, manager or singleton as "enabled" by checking a list of required props
 */
export abstract class ModuleEnabledConfigure {
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
