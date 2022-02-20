/*
import Twitter from "twitter-v2";
import {singleton} from "tsyringe";
import TwitterStream from "twitter-v2/build/TwitterStream";

@singleton()
export class VicTwitter extends Twitter {
    public constructor() {
        super({
            bearer_token: process.env.twitter_bearer_token
        });
        /!*this.listenForever(
            () => this.stream('tweets/search/stream', {
                "media.fields": ["preview_image_url"],
                "expansions": ["attachments.media_keys", "referenced_tweets.id", "author_id"],
                "tweet.fields": ["attachments", "referenced_tweets"]
            }),
            (data) => console.log(data)
        );*!/
    }

    public async listenForever(streamFactory: () => TwitterStream, dataConsumer: (data: any) => void): Promise<void> {
        try {
            for await (const {data} of streamFactory()) {
                dataConsumer(data);
            }
            // The stream has been closed by Twitter. It is usually safe to reconnect.
            console.log('Stream disconnected healthily. Reconnecting.');
            this.listenForever(streamFactory, dataConsumer);
        } catch (error) {
            // An error occurred so we reconnect to the stream. Note that we should
            // probably have retry logic here to prevent reconnection after a number of
            // closely timed failures (may indicate a problem that is not downstream).
            console.warn('Stream disconnected with error. Retrying.', error);
            this.listenForever(streamFactory, dataConsumer);
        }
    }

}*/
