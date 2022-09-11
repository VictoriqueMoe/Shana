import {AbstractValueBackedAutoModFilter} from "./AbstractValueBackedAutoModFilter.js";
import {TimedSet} from "@discordx/utilities";
import {Message} from "discord.js";
import * as Immutable from "immutable";
import {EventDeletedListener} from "../../../../../events/djxManaged/eventDispatcher/EventDeletedListener.js";
import logger from "../../../../../utils/LoggerFactory.js";

export abstract class AbstractValueBackedBulkDeleteAwareFilter<T> extends AbstractValueBackedAutoModFilter<T> {

    private readonly _cooldownArray: TimedSet<BulkDeleteSpamEntry<T>>;

    protected constructor(timeout: number) {
        super();
        this._cooldownArray = new TimedSet(timeout);
    }

    public async doFilter(content: Message): Promise<boolean> {
        const memberId = content.member.id;
        const guildId = content.guildId;
        let fromArray = this.getFromArray(memberId, guildId);
        if (fromArray) {
            fromArray.addMessage(content);
            fromArray.count++;
            this._cooldownArray.refresh(fromArray);
        } else {
            fromArray = new BulkDeleteSpamEntry(memberId, this, guildId, content);
            this._cooldownArray.add(fromArray);
        }
        return !(await fromArray.hasViolationLimitReached(guildId));
    }

    public async postProcess(message: Message): Promise<void> {
        const userId = message.member.id;
        const guildId = message.guildId;
        const messageSpamEntry = this.getFromArray(userId, guildId);
        if (messageSpamEntry) {
            await messageSpamEntry.performDelete();
        }
    }

    private getFromArray(userId: string, guildId: string): BulkDeleteSpamEntry<T> {
        return this._cooldownArray.rawSet.find(value => value.userId === userId && value.guildId === guildId);
    }
}

class BulkDeleteSpamEntry<T> {
    public count: number;
    private readonly _messages: Message[] = [];

    public constructor(public userId: string, private _instance: AbstractValueBackedAutoModFilter<T>, public guildId: string, message: Message) {
        this.count = 1;
        this._messages.push(message);
    }

    public get messages(): Immutable.List<Message> {
        return Immutable.List.of(...this._messages);
    }

    public async hasViolationLimitReached(guildId: string): Promise<boolean> {
        const value = await this._instance.value(guildId);
        return this.count > value;
    }

    public performDelete(): Promise<unknown[]> {
        try {
            const messageDeletePArray = this.messages.map(messageEntryM => {
                if (EventDeletedListener.isMessageDeleted(messageEntryM)) {
                    return Promise.resolve(messageEntryM);
                }
                return messageEntryM.delete().catch(reason => {
                    logger.warn(reason);
                });
            });
            return Promise.all(messageDeletePArray);
        } catch {

        }
    }

    public addMessage(message: Message): void {
        this._messages.push(message);
    }
}
