import {singleton} from "tsyringe";
import axios from "axios";
import FormData from "form-data";

@singleton()
export class OcrManager {

    private baseUrl = process.env.ocr_loc;

    public async getText(image: Buffer): Promise<string> {
        const data = new FormData();
        data.append('file', image, {
            filename: "filename"

        });
        const result = await axios.post(this.baseUrl, data, {
            headers: data.getHeaders()
        });
        if (result.status !== 200) {
            throw new Error(result.statusText);
        }
        return result.data.result;
    }
}