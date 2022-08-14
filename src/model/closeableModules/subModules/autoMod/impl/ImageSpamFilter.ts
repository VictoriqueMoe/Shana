import {Message} from "discord.js";
import {singleton} from "tsyringe";
import {TimedSet} from "@discordx/utilities";
import {AbstractValueBackedAutoModFilter} from "./AbstractValueBackedAutoModFilter.js";

@singleton()
export class ImageSpamFilter extends AbstractValueBackedAutoModFilter<number> {

    private _cooldownArray: TimedSet<MessageSpamEntry>;

    public constructor() {
        super();
        this._cooldownArray = new TimedSet(10000);
    }

    public get defaultValue(): number {
        return 4;
    }

    /**
     * How many images are allowed at once in the space of 10 seconds
     */
    public unMarshalData(data: string): number {
        return Number.parseInt(data);
    }

    public get id(): string {
        return "Image Spam Filter";
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
        return !(await fromArray.hasViolationLimitReached(guildId));

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

    public constructor(public userId: string, private _instance: ImageSpamFilter, public guildId: string) {
        this.count = 1;
    }

    public async hasViolationLimitReached(guildId: string): Promise<boolean> {
        const value = await this._instance.value(guildId);
        return this.count > value;
    }
}
