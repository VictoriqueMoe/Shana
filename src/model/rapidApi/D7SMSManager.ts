import {AbstractRapidApiResponse} from "./AbstractRapidApiResponse";
import {singleton} from "tsyringe";
import axios from "axios";
import {Property} from "../decorators/Property";

export type RequestPayload = {
    to: string,
    from: string,
    content: string
};

export type ResponsePayload = {
    data: string
};

@singleton()
export class D7SMSManager extends AbstractRapidApiResponse {
    private static baseUrl = "https://d7sms.p.rapidapi.com/secure";

    @Property("d7_authKey")
    private _d7Key: string;

    public constructor() {
        super("d7sms.p.rapidapi.com", "_d7Key");
    }


    public async sendSms(payload: RequestPayload): Promise<ResponsePayload> {
        const response = await axios.request({
            ...this.getBaseOptions("POST", {
                "Authorization": `Bearer ${this._d7Key}`
            }),
            url: `${D7SMSManager.baseUrl}/send`,
            data: JSON.stringify(payload)
        });
        return response.data;
    }
}
