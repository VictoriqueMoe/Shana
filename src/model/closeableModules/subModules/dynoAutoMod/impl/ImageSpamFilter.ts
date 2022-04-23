import {AbstractFilter} from "../AbstractFilter";
import {ACTION} from "../../../../../enums/ACTION";
import type {Message} from "discord.js";
import {PRIORITY} from "../../../../../enums/PRIORITY";
import type {IValueBackedDynoAutoModFilter} from "../IValueBackedDynoAutoModFilter";
import {singleton} from "tsyringe";
import {TimedSet} from "@discordx/utilities";

@singleton()
export class ImageSpamFilter extends AbstractFilter implements IValueBackedDynoAutoModFilter<number> {

    private _cooldownArray: TimedSet<MessageSpamEntry>;

    public constructor() {
        super();
        this._cooldownArray = new TimedSet(10000);
    }

    /**
     * How many images are allowed at once in the space of 10 seconds
     */
    public get value(): number {
        return 4; // hard coded for now
    }

    public get actions(): ACTION[] {
        return [ACTION.DELETE, ACTION.WARN, ACTION.MUTE];
    }

    public get id(): string {
        return "Image Spam Filter";
    }

    public get isActive(): boolean {
        return true;
    }

    public get priority(): number {
        return PRIORITY.LAST;
    }

    public get warnMessage(): string {
        return "You are posting too many images, slow down!";
    }

    public async doFilter(content: Message): Promise<boolean> {
        const memberId = content.member.id;
        const attachments = content.attachments;
        const guildId = content.member.guild.id;
        if (attachments.size === 0) {
            return true;
        }
        let fromArray = this.getFromArray(memberId, guildId);
        if (fromArray) {
            fromArray.count++;
            this._cooldownArray.refresh(fromArray);
        } else {
            fromArray = new MessageSpamEntry(memberId, this, guildId);
            this._cooldownArray.add(fromArray);
        }
        return !fromArray.hasViolationLimitReached;

    }

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("Image spam", message);
    }

    private getFromArray(userId: string, guildId: string): MessageSpamEntry {
        const arr = this._cooldownArray.rawSet;
        return arr.find(value => value.userId === userId && value.guildId === guildId);
    }
}

class MessageSpamEntry {
    public count: number;

    constructor(public userId: string, private _instance: ImageSpamFilter, public guildId: string) {
        this.count = 1;
    }

    public get hasViolationLimitReached(): boolean {
        return this.count > this._instance.value;
    }
}
