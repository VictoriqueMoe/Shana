import {Method} from "axios";
import {Property} from "../decorators/Property";
import {ModuleEnabledConfigure} from "../Impl/ModuleEnabledConfigure";
import {ObjectUtil} from "../../utils/Utils";

export type RapidApiBaseOptions = {
    method: Method,
    headers: Record<string, any>
}

export abstract class AbstractRapidApiResponse extends ModuleEnabledConfigure {

    @Property("rapid_api_code", false)
    private readonly rapidApiCode: string;

    protected constructor(private _rapidApiHost: string, ...props: string[]) {
        super("rapidApiCode", ...props);
    }

    protected getBaseOptions(method: Method, additional: RapidApiBaseOptions["headers"]["additional"] = {}): RapidApiBaseOptions {
        const retObject: RapidApiBaseOptions = {
            method: method,
            headers: {
                "x-rapidapi-host": this._rapidApiHost,
                "x-rapidapi-key": this.rapidApiCode,
            }
        };
        if (ObjectUtil.isValidObject(additional)) {
            const headers = retObject["headers"];
            retObject["headers"] = {
                ...headers,
                ...additional
            };
        }

        return retObject;
    }
}
