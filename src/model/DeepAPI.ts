import {Typeings} from "./types/Typeings";
import SenimentTypes = Typeings.DEEP_AI.SenimentTypes;

const deepai = require('deepai');

export class DeepAPI {

    private constructor() {
        deepai.setApiKey(process.env.deepapi);
    }

    private static _instance: DeepAPI;

    public static get instance(): DeepAPI {
        if (!DeepAPI._instance) {
            DeepAPI._instance = new DeepAPI();
        }
        return DeepAPI._instance;
    }

    public sentimentAnalysis(statement: string): Promise<SenimentTypes> {
        return deepai.callStandardApi("sentiment-analysis", {
            text: statement,
        }).then((resp: Typeings.DEEP_AI.SentimentAnalysisResponse) => resp.output[0]);
    }
}