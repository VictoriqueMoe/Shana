import {ArgsOf, Client, Guard, On} from "@typeit/discord";
import {ObjectUtil} from "../../utils/Utils";
import {TimedArray} from "../../model/TimedArray";
import fetch from "node-fetch";
import {Main} from "../../Main";
import {NotBot} from "../../guards/NotABot";
import {WeebGFSession} from "./WeebGFSession";

const {cleverBotKey} = require('../../../config.json');

type celverBotResponse = {
    cs: string,
    input: string,
    conversation_id: string,
    output: string,
    interaction_count: string,
    time_elapsed: string
};

type cleverBotRequest = {
    key: string,
    input: string,
    cb_settings_tweak1?: number, //sensible to wacky
    cb_settings_tweak2?: number, // shy to talkative
    cb_settings_tweak3?: number, // self-centred to attentive
    cs?: string
}

export abstract class WeebGF {

    private _sessionArray: TimedArray<WeebGFSession>;
    private readonly api = `https://www.cleverbot.com/getreply`;

    private constructor() {
        this._sessionArray = new TimedArray(600000); // 10 mins
        //this._sessionArray = new TimedArray(30000);
    }

    @On("message")
    @Guard(NotBot)
    private async listen([message]: ArgsOf<"message">, client: Client): Promise<void> {
        const messageContent = message.content;
        if (!ObjectUtil.validString(messageContent)) {
            return;
        }
        if(messageContent.startsWith("~ignore")){
            return;
        }
        //TODO: make a guard
        const channelId = message.channel.id;
        let shouldPost: boolean;
        if (Main.testMode && message.member.id === "697417252320051291") {
            shouldPost = true;
        } else {
            shouldPost = channelId === "815042892120457216" || channelId === "815426029094699029";
        }
        if (!shouldPost) {
            return;
        }
        let cs: string = null;
        const guildId = message.guild.id;
        const sessionFromArray = this.getFromArray(guildId);
        if (ObjectUtil.validString(sessionFromArray)) {
            cs = sessionFromArray.cs;
        }
        const cb_settings_tweak1 = this.randomIntFromInterval(1, 30);
        const cb_settings_tweak2 = this.randomIntFromInterval(60, 100);
        const cb_settings_tweak3 = this.randomIntFromInterval(50, 100);
        const request: cleverBotRequest = {
            "key": cleverBotKey,
            "input": messageContent,
        };
        if (ObjectUtil.validString(cs)) {
            request.cs = cs;
        }
        const url = Object.keys(request).map(key => `${key}=${encodeURIComponent(request[key])}`).join('&');
        let reply: celverBotResponse = null;
        try {
            const replyPayload = await fetch(`${this.api}?${url}`, {
                method: 'get'
            });
            reply = await replyPayload.json();
            if (replyPayload.status !== 200) {
                message.channel.send("An error has occured");
                console.error(reply);
                return;
            }
        } catch (e) {
            message.channel.send(`An error has occured, please try again. Message was: "${messageContent}"`);
            console.error(e);
            this._sessionArray.clear();
            return;
        }

        if (ObjectUtil.validString(sessionFromArray)) {
            this._sessionArray.remove(sessionFromArray);
        }
        this._sessionArray.push(new WeebGFSession(guildId, reply.cs));
        message.channel.send(reply.output);
    }

    private getFromArray(guild: string): WeebGFSession {
        const arr = this._sessionArray.rawSet;
        return arr.find(value => value.guildId === guild);
    }

    private randomIntFromInterval(min: number, max: number): number { // min and max included
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
}