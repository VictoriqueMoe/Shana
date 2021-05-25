import {AbstractFilter} from "../AbstractFilter";
import {IValueBackedDynoAutoModFilter} from "../IValueBackedDynoAutoModFilter";
import {TimedSet} from "../../../../Impl/TimedSet";
import {ACTION} from "../../../../../enums/ACTION";
import {Message} from "discord.js";
import {ObjectUtil} from "../../../../../utils/Utils";
import {InjectDynoSubModule} from "../../../../decorators/InjectDynoSubModule";
import {PRIORITY} from "../../../../../enums/PRIORITY";
import {ICloseableModule} from "../../../ICloseableModule";
import {DynoAutoMod} from "../../../../../events/closeableModules/DynoAutoMod";

@InjectDynoSubModule(DynoAutoMod)
export class FastMessageSpamFilter extends AbstractFilter implements IValueBackedDynoAutoModFilter {

    private _cooldownArray: TimedSet<MessageSpamEntry>;

    private constructor(parentFilter: ICloseableModule) {
        super(parentFilter);
        this._cooldownArray = new TimedSet(5000);
    }

    /**
     * How many messages they are allowed to send in 5 seconds
     */
    public get value(): string {
        return "5"; // hard coded for now
    }

    public get actions(): ACTION[] {
        return [ACTION.DELETE, ACTION.WARN, ACTION.MUTE];
    }

    public get id(): string {
        return "Fast Message Spam Filter";
    }

    public get isActive(): boolean {
        return true;
    }

    public get priority(): number {
        return PRIORITY.LAST;
    }

    public get warnMessage(): string {
        return "You are posting too fast, slow down!";
    }

    public doFilter(content: Message): boolean {
        if (!ObjectUtil.validString(content.content)) {
            return true;
        }
        const memberId = content.member.id;
        let fromArray = this.getFromArray(memberId, content.member.guild.id);
        if (fromArray) {
            fromArray.count++;
            this._cooldownArray.refresh(fromArray);
        } else {
            fromArray = new MessageSpamEntry(memberId, this, content.member.guild.id);
            this._cooldownArray.add(fromArray);
        }
        return !fromArray.hasViolationLimitReached;

    }

    private getFromArray(userId: string, guildId: string): MessageSpamEntry {
        const arr = this._cooldownArray.rawSet;
        return arr.find(value => value.userId === userId && value.guildId === guildId);
    }

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("Message spam", message);
    }
}

class MessageSpamEntry {
    public count: number;

    constructor(public userId: string, private _instance: FastMessageSpamFilter, public guildId: string) {
        this.count = 1;
    }

    public get hasViolationLimitReached(): boolean {
        return this.count > Number.parseInt(this._instance.value);
    }
}
