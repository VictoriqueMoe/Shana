import {singleton} from "tsyringe";
import fetch from 'node-fetch';
import {ObjectUtil} from "../../../utils/Utils.js";

@singleton()
export class AnonFilesManager {
    private readonly baseUrl = "https://0x0.st";
    private readonly MAX_CONTENT_SIZE = 10485760; // 10MB

    public async uploadFile(url: string): Promise<string> {
        const headCheck = await fetch(url, {
            method: "HEAD"
        });
        const contentLengthStr = headCheck.headers.get("content-length");
        if (!ObjectUtil.validString(contentLengthStr)) {
            throw new Error("Unable to obtain content size for deleted file");
        }
        const contentLength = Number.parseInt(contentLengthStr);
        if (contentLength > this.MAX_CONTENT_SIZE) {
            throw new Error("Content Type too big");
        }
        const params = new URLSearchParams();
        params.append('url', url);
        const response = await fetch(this.baseUrl, {method: 'POST', body: params});
        const resultText = await response.text();
        return resultText.trim();
    }
}
