import {Typeings} from "./types/Typeings";
import {singleton} from "tsyringe";
import deepai from 'deepai';
import SenimentTypes = Typeings.DEEP_AI.SenimentTypes;
import ImageSimilarity = Typeings.DEEP_AI.ImageSimilarity;
import TextGeneration = Typeings.DEEP_AI.TextGeneration;

@singleton()
export class DeepAPI {

    public constructor() {
        deepai.setApiKey(process.env.deepapi);
    }

    public sentimentAnalysis(statement: string): Promise<SenimentTypes> {
        return deepai.callStandardApi("sentiment-analysis", {
            text: statement,
        }).then((resp: Typeings.DEEP_AI.SentimentAnalysisResponse) => resp.output[0]);
    }

    public imageSimilarity(imagee1: string, image2: string): Promise<ImageSimilarity["output"]["distance"]> {
        return deepai.callStandardApi("image-similarity", {
            imagee1,
            image2,
        }).then((resp: ImageSimilarity) => resp.output.distance);
    }

    public textGeneration(text: string): Promise<TextGeneration["output"]> {
        return deepai.callStandardApi("text-generator", {
            text
        }).then((resp: TextGeneration) => resp.output);
    }
}