import {AbstractFilter} from "../AbstractFilter";
import {ACTION} from "../../../../../enums/ACTION";
import {GuildMember, Message} from "discord.js";
import {BannedWordEntryies, IBannedWordDynoAutoModFilter} from "../IBannedWordDynoAutoModFilter";
import {InjectDynoSubModule} from "../../../../decorators/InjectDynoSubModule";
import {PRIORITY} from "../../../../../enums/PRIORITY";
import {DynoAutoMod} from "../../../../../managedEvents/messageEvents/closeableModules/DynoAutoMod";
import {GuildUtils} from "../../../../../utils/Utils";

@InjectDynoSubModule(DynoAutoMod)
export class BannedWordFilter extends AbstractFilter implements IBannedWordDynoAutoModFilter {

    public get actions(): ACTION[] {
        return [ACTION.DELETE, ACTION.WARN, ACTION.MUTE];
    }

    public get bannedWords(): BannedWordEntryies {
        return {
            "exactWord": ["retard", "retarded", "tard", "tards", "retards", "fag", "fags", "faggot", "faggots", "nigger"],
            "WildCardWords": ["nigger", "cunt", "nigga", "lambda.it.cx", "taciturasa", "gljfizd8xKgsSrU7dafuw", "fmqdWC-eVqc", "chng.it"]
        };
    }

    /**
     * return true if user was sent to jail
     * @param member
     */
    public async checkUsername(member: GuildMember): Promise<boolean> {
        if (!this.doesNotFailValidation(member.displayName)) {
            await GuildUtils.sendToJail(member, "You have been placed here because your display name voilates our rules, Please change it");
            return true;
        }
        return false;
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
        return this.doesNotFailValidation(content.content);
    }

    private doesNotFailValidation(content: string): boolean {
        const badWordObj = this.bannedWords;
        const exactArry = badWordObj.exactWord;
        const inStringArray = badWordObj.WildCardWords;
        const messageContent = content.trim().toLowerCase();
        const splitMessage = messageContent.split(" ");
        for (const exactWord of exactArry) {
            const volutesExactWord = splitMessage.indexOf(exactWord.toLowerCase()) > -1;
            if (volutesExactWord) {
                return false;
            }
        }
        for (const wildCardString of inStringArray) {
            const localString = messageContent.replace(/\s/gim, "");
            const violatesExactWord = localString.includes(wildCardString.toLowerCase());
            if (violatesExactWord) {
                return false;
            }
        }
        return true;
    }

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("Banned words", message);
    }
}