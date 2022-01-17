import {singleton} from "tsyringe";

@singleton()
export class OcrManager {

    private baseUrl = process.env.ocr_loc;

    public async getText(image: Buffer): Promise<string> {
        const formData = new FormData();
        const blob = new Blob([image]);
        formData.append("file", blob);
        const request = await fetch(this.baseUrl, {
            method: "POST",
            body: formData
        });
        if (request.status !== 200) {
            throw new Error(request.statusText);
        }
        const json = await request.json();
        return json.result;
    }
}