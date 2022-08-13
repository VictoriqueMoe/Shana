import {AbstractFilter} from "../AbstractFilter.js";
import {Message} from "discord.js";
import {singleton} from "tsyringe";
import {ObjectUtil} from "../../../../../utils/Utils.js";
import ACTION from "../../../../../enums/ACTION.js";
import PRIORITY from "../../../../../enums/PRIORITY.js";
import {BannedWordEntries, IBannedWordAutoModFilter} from "../IBannedWordAutoModFilter.js";

@singleton()
export class BannedWordFilter extends AbstractFilter implements IBannedWordAutoModFilter {

    public get actions(): ACTION[] {
        return [ACTION.DELETE, ACTION.WARN, ACTION.MUTE];
    }

    public get bannedWords(): BannedWordEntries {
        return {
            "exactWord": ["retard", "retarded", "tard", "tards", "retards", "fag", "fags", "faggot", "faggots", "nigger"],
            "WildCardWords": ["nigger", "cunt", "nigga", "lambda.it.cx", "taciturasa", "gljfizd8xKgsSrU7dafuw", "fmqdWC-eVqc", "chng.it"]
        };
    }

    public get id(): string {
        return "Banned Word Filter";
    }

    public get isActive(): boolean {
        return true;
    }

    public get priority(): number {
        return PRIORITY.FIRST;
    }

    public get warnMessage(): string {
        return "Watch your language!";
    }

    /**
     * return true if the word is banned
     * @param word
     */
    public isWordBanned(word: string): boolean {
        if (!ObjectUtil.validString(word)) {
            return false;
        }
        const badWordObj = this.bannedWords;
        const exactArray = badWordObj.exactWord;
        const inStringArray = badWordObj.WildCardWords;
        const messageContent = word.trim().toLowerCase();
        const splitMessage = messageContent.split(" ");
        for (const exactWord of exactArray) {
            const volutesExactWord = splitMessage.indexOf(exactWord.toLowerCase()) > -1;
            if (volutesExactWord) {
                return true;
            }
        }
        for (const wildCardString of inStringArray) {
            const localString = messageContent.replace(/\s/gim, "");
            const violatesExactWord = localString.includes(wildCardString.toLowerCase());
            if (violatesExactWord) {
                return true;
            }
        }
        return false;
    }

    public doFilter(content: Message): Promise<boolean> {
        return Promise.resolve(!this.isWordBanned(content.content));
    }

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("Banned words", message);
    }

}