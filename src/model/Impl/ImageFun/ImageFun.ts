import {
    additionalGenGetArgs,
    GenerateEndPointGetAllResponse,
    GenerateEndPointRequest,
    GenerateEndPointResponse,
    ImageEndPointGetAllResponse,
    ImageEndPointRequest,
    ImageEndPointResponse
} from "./Typeings";
import {URLSearchParams} from "url";
import fetch from 'node-fetch';
import {singleton} from "tsyringe";
import {Property} from "../../decorators/Property";
import {ModuleEnabledConfigure} from "../ModuleEnabledConfigure";

@singleton()
export class ImageFun extends ModuleEnabledConfigure {

    @Property("amethysteToken", false)
    private readonly token: string;
    private readonly baseUrl: string = "https://v1.api.amethyste.moe";

    public constructor() {
        super("token");
    }

    private get authHeader(): Record<string, string> {
        return {
            'Authorization': `Bearer ${this.token}`
        };
    }

    public async generate(request: GenerateEndPointRequest): Promise<GenerateEndPointResponse> {
        const urlencoded = new URLSearchParams();
        const body = request.Body_Params;
        urlencoded.append("url", body.url);
        if (body.additional) {
            this.eachRecursive(body.additional, urlencoded);
        }
        const wrapper = await fetch(`${this.baseUrl}/generate/${request.endPoint}`, {
            "method": 'POST',
            "headers": this.authHeader,
            "body": urlencoded
        });

        if (wrapper.status !== 200) {
            const json = await wrapper.json() as any;
            const error = json.message;
            throw new Error(error);
        }
        return wrapper.buffer();
    }

    public async image(request: ImageEndPointRequest): Promise<ImageEndPointResponse> {
        return null;
    }

    public async getEndpointsGenerate(): Promise<GenerateEndPointGetAllResponse> {
        const wrapper = await fetch(`${this.baseUrl}/generate`, {
            "method": "get",
            "headers": this.authHeader
        });
        return wrapper.json() as Promise<GenerateEndPointGetAllResponse>;
    }

    public async getEndpointsImage(): Promise<ImageEndPointGetAllResponse> {
        const wrapper = await fetch(`${this.baseUrl}/image`, {
            "method": "get",
            "headers": this.authHeader
        });
        return wrapper.json() as Promise<ImageEndPointGetAllResponse>;
    }

    private eachRecursive(obj: additionalGenGetArgs, params: URLSearchParams): void {
        for (const k in obj) {
            if (typeof obj[k] == "object" && obj[k] !== null) {
                this.eachRecursive(obj[k], params);
            } else {
                params.append(k, obj[k]);
            }
        }
    }

}
