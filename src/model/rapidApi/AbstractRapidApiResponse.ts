import {Method} from "axios";
import {Property} from "../decorators/Property";
import {ModelEnabledConfigure} from "../Impl/ModelEnabledConfigure";

export type RapidApiBaseOptions = {
    method: Method,
    headers: {
        'x-rapidapi-host': string,
        'x-rapidapi-key': string
    }
}

export abstract class AbstractRapidApiResponse extends ModelEnabledConfigure {

    @Property("rapid_api_code", {required: false})
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
