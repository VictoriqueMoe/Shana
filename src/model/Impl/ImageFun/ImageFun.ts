import {
    additionalGenGetArgs,
    GenerateEndPointGetAllResponse,
    GenerateEndPointRequest,
    GenerateEndPointResponse,
    ImageEndPointGetAllResponse,
    ImageEndPointRequest,
    ImageEndPointResponse
} from "./Typeings";
import fetch, {Headers} from "node-fetch";
import {URLSearchParams} from "url";

const {amethysteToken} = require('../../../../config.json');

export class ImageFun {
    private static _instance: ImageFun;
    private readonly token: string = amethysteToken;
    private readonly baseUrl: string = "https://v1.api.amethyste.moe";

    private constructor() {
    }

    public static get instance(): ImageFun {
        if (!ImageFun._instance) {
            ImageFun._instance = new ImageFun();
        }
        return ImageFun._instance;
    }

    public async generate(request: GenerateEndPointRequest): Promise<GenerateEndPointResponse> {
        const requestOptions = {
            method: 'POST',
            "headers": this.authHeader,

        };
        const urlencoded = new URLSearchParams();
        const body = request.Body_Params;
        urlencoded.append("url", body.url);
        if (body.additional) {
            this.eachRecursive(body.additional, urlencoded);
        }
        requestOptions["body"] = urlencoded;
        const wrapper = await fetch(`${this.baseUrl}/generate/${request.endPoint}`, requestOptions);

        if (wrapper.status !== 200) {
            const json = await wrapper.json();
            const error = json.message;
            throw new Error(error);
        }
        return wrapper.buffer();
    }

    private eachRecursive(obj: additionalGenGetArgs, params: URLSearchParams) {
        for (const k in obj) {
            if (typeof obj[k] == "object" && obj[k] !== null) {
                this.eachRecursive(obj[k], params);
            } else {
                params.append(k, obj[k]);
            }
        }
    }

    public async image(request: ImageEndPointRequest): Promise<ImageEndPointResponse> {
        return null;
    }

    public async getEndpointsGenerate(): Promise<GenerateEndPointGetAllResponse> {
        const wrapper = await fetch(`${this.baseUrl}/generate`, {
            "method": "get",
            "headers": this.authHeader
        });
        return await wrapper.json();
    }

    public async getEndpointsImage(): Promise<ImageEndPointGetAllResponse> {
        const wrapper = await fetch(`${this.baseUrl}/image`, {
            "method": "get",
            "headers": this.authHeader
        });
        return await wrapper.json();
    }

    private get authHeader(): Headers {
        return new Headers({
            'Authorization': `Bearer ${this.token}`
        });
    }

}