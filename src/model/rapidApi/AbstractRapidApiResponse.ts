import {Method} from "axios";
import {Property} from "../decorators/Property";
import {ModuleEnabledConfigure} from "../Impl/ModuleEnabledConfigure";

export type RapidApiBaseOptions = {
    method: Method,
    headers: {
        'x-rapidapi-host': string,
        'x-rapidapi-key': string
    }
}

export abstract class AbstractRapidApiResponse extends ModuleEnabledConfigure {

    @Property("rapid_api_code", false)
    private readonly rapidApiCode: string;

    protected constructor(private _rapidApiHost: string, private _method: Method) {
        super("rapidApiCode");
    }

    protected getBaseOptions(): RapidApiBaseOptions {
        return {
            method: this._method,
            headers: {
                "x-rapidapi-host": this._rapidApiHost,
                "x-rapidapi-key": this.rapidApiCode
            }
        };
    }
}
