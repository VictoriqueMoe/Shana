import {AbstractFilter} from "../AbstractFilter";
import {BannedWordEntryies, IBannedWordDynoAutoModFilter} from "../IBannedWordDynoAutoModFilter";
import {ACTION} from "../../../../../enums/ACTION";
import {PRIORITY} from "../../../../../enums/PRIORITY";
import {Message} from "discord.js";
import {ObjectUtil} from "../../../../../utils/Utils";
import {https} from 'follow-redirects';
import {singleton} from "tsyringe";

const getUrls = require('get-urls');
const uu = require('url-unshort')();

@singleton()
export class ScamFilter extends AbstractFilter implements IBannedWordDynoAutoModFilter {

    public get actions(): ACTION[] {
        return [ACTION.DELETE, ACTION.WARN, ACTION.MUTE];
    }

    public get bannedWords(): BannedWordEntryies {
        return {
            "exactWord": [],
            "WildCardWords": ["nigger", "cunt", "nigga", "lambda.it.cx", "taciturasa", "gljfizd8xKgsSrU7dafuw", "fmqdWC-eVqc", "chng.it"]
        };
    }

    public get id(): string {
        return "Scam Filter";
    }

    public get isActive(): boolean {
        return true;
    }

    public get priority(): number {
        return PRIORITY.FIRST;
    }

    public get warnMessage(): string {
        return "Stop Scamming!";
    }

    public async doFilter(content: Message): Promise<boolean> {
        /* const messageDetail = content.content;
         const urlsInMessage = getUrls(messageDetail);
         for (let url of urlsInMessage) {
             try {
                 url = await this.getOriginalUrl(url);
             } catch {

             }
             const {WildCardWords} = this.bannedWords;
             for (const wildCardString of WildCardWords) {
                 const violatesExactWord = messageDetail.includes(wildCardString.toLowerCase());
                 if (violatesExactWord) {
                     return false;
                 }
             }
         }*/
        return true;
    }

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("Scammer", message);
    }

    private getOriginalUrl(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            uu.expand(url).then(expandedUrl => {
                if (ObjectUtil.validString(expandedUrl)) {
                    return expandedUrl;
                }
                reject("Unable to expand URL");
            }).then(expandedUrl => {
                https.get(expandedUrl, response => {
                    resolve(response.responseUrl);
                }).on('error', err => {
                    reject(err);
                });
            });
        });
    }

}