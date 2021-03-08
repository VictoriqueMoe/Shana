import {AbstractFilter} from "../AbstractFilter";
import {BannedWordEntryies, IBannedWordMessageGateKeeperFilter} from "../IBannedWordMessageGateKeeperFilter";
import {ACTION} from "../../../../../../enums/ACTION";
import {Message} from "discord.js";
import {InjectDynoSubModule} from "../../../../../decorators/InjectDynoSubModule";
import {PRIORITY} from "../../../../../../enums/PRIORITY";
import {MessageGateKeeper} from "../../../../../../events/closeableModules/MessageGateKeeper";

@InjectDynoSubModule(MessageGateKeeper)
export class BannedWordFilter extends AbstractFilter implements IBannedWordMessageGateKeeperFilter {

    public get actions(): ACTION[] {
        return [ACTION.DELETE, ACTION.WARN, ACTION.MUTE];
    }

    public get bannedWords(): BannedWordEntryies {
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

    doFilter(content: Message): boolean {
        const badWordObj = this.bannedWords;
        const exactArry = badWordObj.exactWord;
        const inStringArray = badWordObj.WildCardWords;
        const messageContent = content.content.trim().toLowerCase();
        const splitMessage = messageContent.split(" ");
        for (const exactWord of exactArry) {
            const volutesExactWord = splitMessage.indexOf(exactWord.toLowerCase()) > -1;
            if (volutesExactWord) {
                return false;
            }
        }
        for (const wildCardString of inStringArray) {
            const violatesExactWord = messageContent.includes(wildCardString.toLowerCase());
            if (violatesExactWord) {
                return false;
            }
        }
        return true;
    }

}