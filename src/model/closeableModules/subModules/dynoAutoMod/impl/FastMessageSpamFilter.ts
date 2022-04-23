import {AbstractFilter} from "../AbstractFilter";
import type {IValueBackedDynoAutoModFilter} from "../IValueBackedDynoAutoModFilter";
import {ACTION} from "../../../../../enums/ACTION";
import type {Message} from "discord.js";
import {ObjectUtil} from "../../../../../utils/Utils";
import {PRIORITY} from "../../../../../enums/PRIORITY";
import * as Immutable from "immutable";
import {singleton} from "tsyringe";
import {TimedSet} from "@discordx/utilities";

@singleton()
export class FastMessageSpamFilter extends AbstractFilter implements IValueBackedDynoAutoModFilter<number> {

    private _cooldownArray: TimedSet<MessageSpamEntry>;

    public constructor() {
        super();
        this._cooldownArray = new TimedSet(5000);
    }

    /**
     * How many messages they are allowed to send in 5 seconds
     */
    public get value(): number {
        return 5; // hard coded for now
    }

    public get actions(): ACTION[] {
        return [ACTION.WARN, ACTION.DELETE, ACTION.MUTE];
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

    public async doFilter(content: Message): Promise<boolean> {
        if (!ObjectUtil.validString(content.content)) {
            return true;
        }
        const memberId = content.member.id;
        let fromArray = this.getFromArray(memberId, content.member.guild.id);
        if (fromArray) {
            fromArray.addMessage(content);
            fromArray.count++;
            this._cooldownArray.refresh(fromArray);
        } else {
            fromArray = new MessageSpamEntry(memberId, this, content.member.guild.id, content);
            this._cooldownArray.add(fromArray);
        }
        return !fromArray.hasViolationLimitReached;

    }

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("Message spam", message);
    }

    public getFromArray(userId: string, guildId: string): MessageSpamEntry {
        const arr = this._cooldownArray.rawSet;
        return arr.find(value => value.userId === userId && value.guildId === guildId);
    }
}

class MessageSpamEntry {
    public count: number;

    constructor(public userId: string, private _instance: FastMessageSpamFilter, public guildId: string, message: Message) {
        this.count = 1;
        this._messages.push(message);
    }

    private _messages: Message[] = [];

    public get hasViolationLimitReached(): boolean {
        return this.count > this._instance.value;
    }

    public get messages(): Immutable.List<Message> {
        return Immutable.List.of(...this._messages);
    }

    public addMessage(message: Message): void {
        this._messages.push(message);
    }
}
