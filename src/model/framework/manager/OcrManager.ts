import {singleton} from "tsyringe";
import {Property} from "../decorators/Property.js";
import fetch, {File, FormData} from 'node-fetch';

@singleton()
export class OcrManager {

    @Property("OCR_LOC", false)
    private readonly baseUrl;

    public async getText(image: Buffer): Promise<string> {
        const formData = new FormData();
        const imageData = new File([image], 'filename', {type: 'text/plain'});
        formData.set("file", imageData, "filename");
        const resultObj = await fetch(this.baseUrl, {
            method: "POST",
            body: formData
        });
        if (resultObj.status !== 200) {
            throw new Error(resultObj.statusText);
        }
        const result = await resultObj.text();
        return result.trim();
    }
}
