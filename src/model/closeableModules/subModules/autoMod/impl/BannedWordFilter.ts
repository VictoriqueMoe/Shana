import {AbstractFilter} from "../AbstractFilter.js";
import {Message} from "discord.js";
import {singleton} from "tsyringe";
import {ObjectUtil} from "../../../../../utils/Utils.js";
import {BannedWordEntries, IBannedWordAutoModFilter} from "../IBannedWordAutoModFilter.js";
import {
    BannedWordFilterModuleModel
} from "../../../../DB/entities/autoMod/impl/subModules/impl/AutoMod/BannedWordFilterModule.model.js";

@singleton()
export class BannedWordFilter extends AbstractFilter implements IBannedWordAutoModFilter {

    public get id(): string {
        return "Banned Word Filter";
    }

    /**
     * return true if the word is banned
     * @param word
     * @param guildId
     */
    public async isWordBanned(word: string, guildId: string): Promise<boolean> {
        if (!ObjectUtil.validString(word)) {
            return false;
        }
        const badWordObj = await this.bannedWords(guildId);
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

    public async doFilter(content: Message): Promise<boolean> {
        return !(await this.isWordBanned(content.content, content.guildId));
    }

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("Banned words", message);
    }

    public bannedWords(guildId: string): Promise<BannedWordEntries> {
        return this._filterManager.getSetting(guildId, this).then((setting: BannedWordFilterModuleModel) => setting.bannedWords);
    }

}
