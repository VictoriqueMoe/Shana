import {Message} from "discord.js";
import {ObjectUtil} from "../../../../../utils/Utils.js";
import * as Immutable from "immutable";
import {singleton} from "tsyringe";
import {TimedSet} from "@discordx/utilities";
import {AbstractValueBackedAutoModFilter} from "./AbstractValueBackedAutoModFilter.js";

@singleton()
export class FastMessageSpamFilter extends AbstractValueBackedAutoModFilter<number> {

    private _cooldownArray: TimedSet<MessageSpamEntry>;

    public constructor() {
        super();
        this._cooldownArray = new TimedSet(5000);
    }

    public get defaultValue(): number {
        return 5;
    }

    /**
     * How many messages they are allowed to send in 5 seconds
     */
    public unMarshalData(data: string): number {
        return Number.parseInt(data);
    }

    public get id(): string {
        return "Fast Message Spam Filter";
    }

    public async doFilter(content: Message): Promise<boolean> {
        if (!ObjectUtil.validString(content.content)) {
            return true;
        }
        const memberId = content.member.id;
        let fromArray = this.getFromArray(memberId, content.guildId);
        if (fromArray) {
            fromArray.addMessage(content);
            fromArray.count++;
            this._cooldownArray.refresh(fromArray);
        } else {
            fromArray = new MessageSpamEntry(memberId, this, content.guildId, content);
            this._cooldownArray.add(fromArray);
        }
        return !(await fromArray.hasViolationLimitReached(content.guildId));

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

    public constructor(public userId: string, private _instance: FastMessageSpamFilter, public guildId: string, message: Message) {
        this.count = 1;
        this._messages.push(message);
    }

    private _messages: Message[] = [];

    public async hasViolationLimitReached(guildId: string): Promise<boolean> {
        const value = await this._instance.value(guildId);
        return this.count > value;
    }

    public get messages(): Immutable.List<Message> {
        return Immutable.List.of(...this._messages);
    }

    public addMessage(message: Message): void {
        this._messages.push(message);
    }
}
