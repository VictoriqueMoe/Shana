import {AbstractValueBackedAutoModFilter} from "./AbstractValueBackedAutoModFilter.js";
import {TimedSet} from "@discordx/utilities";
import {Message} from "discord.js";
import * as Immutable from "immutable";
import {EventDeletedListener} from "../../../../../events/djxManaged/eventDispatcher/EventDeletedListener.js";
import logger from "../../../../../utils/LoggerFactory.js";

/**
 * Base class for filters that can bulk delete all messages that are sent from the first time a filter failed. this assumes `value` to a number and that number is how many times this filter needs to fail to be marked as violated. if the violation limit is not hit, then this filter is not "failed" <br/> <br/>
 * if the limit is hit, then the filter is reported as failed and all messages sent from the first failure to now will be deleted. <br/> <br/>
 * This filter is timed. any value that is sent will have a limited time before it is evicted from the internal set. this is mainly used for message spam filters to detect if a member has sent too many messages in a time range.
 */
export abstract class AbstractValueBackedBulkDeleteAwareFilter extends AbstractValueBackedAutoModFilter<number> {

    private readonly _cooldownArray: TimedSet<BulkDeleteSpamEntry>;

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

    public override async postProcess(message: Message): Promise<void> {
        const userId = message.member.id;
        const guildId = message.guildId;
        const messageSpamEntry = this.getFromArray(userId, guildId);
        if (messageSpamEntry) {
            await messageSpamEntry.performDelete();
        }
    }

    private getFromArray(userId: string, guildId: string): BulkDeleteSpamEntry {
        return this._cooldownArray.rawSet.find(value => value.userId === userId && value.guildId === guildId);
    }
}

class BulkDeleteSpamEntry {
    public count: number;
    private readonly _messages: Message[] = [];

    public constructor(public userId: string, private _instance: AbstractValueBackedAutoModFilter<number>, public guildId: string, message: Message) {
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
                return messageEntryM.delete().catch(err => {
                    if (err instanceof Error) {
                        logger.warn(err.message);
                    } else {
                        logger.warn(err);
                    }
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
