import {Method} from "axios";

export type RapidApiBaseOptions = {
    method: Method,
    headers: {
        'x-rapidapi-host': string,
        'x-rapidapi-key': string
    }
}

export abstract class AbstractRapidApiResponse {

    protected constructor(private _rapidApiHost: string, private _method: Method) {
    }

    protected getBaseOptions(): RapidApiBaseOptions {
        return {
            method: this._method,
            headers: {
                "x-rapidapi-host": this._rapidApiHost,
                "x-rapidapi-key": process.env.rapid_api_code
            }
        };
    }
}