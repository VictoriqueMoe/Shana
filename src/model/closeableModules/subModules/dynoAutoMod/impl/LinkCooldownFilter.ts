import {AbstractFilter} from "../AbstractFilter.js";
import {ACTION} from "../../../../../enums/ACTION.js";
import {Message} from "discord.js";
import {PRIORITY} from "../../../../../enums/PRIORITY.js";
import {IValueBackedDynoAutoModFilter} from "../IValueBackedDynoAutoModFilter.js";
import {TimedSet} from "../../../../Impl/TimedSet.js";
import {singleton} from "tsyringe";
import {ObjectUtil} from "../../../../../utils/Utils.js";

@singleton()
export class LinkCooldownFilter extends AbstractFilter implements IValueBackedDynoAutoModFilter {
    private readonly _cooldownArray: TimedSet<LinkCooldownEntry>;

    public constructor() {
        super();
        this._cooldownArray = new TimedSet(Number.parseInt(this.value) * 1000);
    }

    public get actions(): ACTION[] {
        return [ACTION.DELETE, ACTION.WARN];
    }

    public get isActive(): boolean {
        return false;
    }

    public get cooldownArray(): TimedSet<LinkCooldownEntry> {
        return this._cooldownArray;
    }

    /**
     * The time between links
     */
    public get value(): string {
        return "5"; // hard coded for now
    }

    public get id(): string {
        return "Link Cooldown Filter";
    }

    public get warnMessage(): string {
        return `Stop sending so many links! wait ${this.value} seconds`;
    }

    public get priority(): number {
        return PRIORITY.LAST;
    }

    public async doFilter(content: Message): Promise<boolean> {
        const messageContent = content.content;
        const urls = ObjectUtil.getUrls(messageContent);
        if (urls && urls.size > 0) {
            const memberId = content.member.id;
            const guildId = content.member.guild.id;
            let fromArray = this.getFromArray(memberId, guildId);
            if (!fromArray) {
                fromArray = new LinkCooldownEntry(memberId, guildId);
                fromArray.messageArray.push(content);
                this._cooldownArray.add(fromArray);
                return true;
            }
            fromArray.messageArray.push(content);
            this._cooldownArray.refresh(fromArray);
            return false;
        }
        return true;
    }

    public getFromArray(userId: string, guildId: string): LinkCooldownEntry {
        const arr = this._cooldownArray.rawSet;
        return arr.find(value => value.userId === userId && value.guildId === guildId);
    }

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("Link cooldown", message);
    }
}

class LinkCooldownEntry {

    public messageArray: Message[] = [];

    constructor(public userId: string, public guildId: string) {
    }
}