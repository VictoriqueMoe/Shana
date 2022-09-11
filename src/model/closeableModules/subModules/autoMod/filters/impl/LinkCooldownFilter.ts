import {Message} from "discord.js";
import {ObjectUtil} from "../../../../../../utils/Utils.js";
import {TimedSet} from "@discordx/utilities";
import {AbstractValueBackedAutoModFilter} from "../AbstractValueBackedAutoModFilter.js";

export class LinkCooldownFilter extends AbstractValueBackedAutoModFilter<number> {
    private readonly _cooldownArray: Map<string, TimedSet<LinkCooldownEntry>> = new Map();

    public constructor() {
        super();
    }

    public get defaultValue(): number {
        return 5;
    }

    public get cooldownArray(): Map<string, TimedSet<LinkCooldownEntry>> {
        return this._cooldownArray;
    }

    public get id(): string {
        return "Link Cooldown Filter";
    }

    /**
     * The time between links
     */
    public unMarshalData(data: string): number {
        return Number.parseInt(data);
    }

    public async doFilter(content: Message): Promise<boolean> {
        if (!this._cooldownArray.has(content.guildId)) {
            const value = await this.value(content.guildId) * 1000;
            this._cooldownArray.set(content.guildId, new TimedSet(value));
        }
        const messageContent = content.content;
        const urls = ObjectUtil.getUrls(messageContent);
        if (urls && urls.size > 0) {
            const memberId = content.member.id;
            const guildId = content.member.guild.id;
            let fromArray = this.getFromArray(memberId, guildId);
            if (!fromArray) {
                fromArray = new LinkCooldownEntry(memberId);
                fromArray.messageArray.push(content);
                this._cooldownArray.get(guildId).add(fromArray);
                return true;
            }
            fromArray.messageArray.push(content);
            this._cooldownArray.get(guildId).refresh(fromArray);
            return false;
        }
        return true;
    }

    public getFromArray(userId: string, guildId: string): LinkCooldownEntry {
        const arr = this._cooldownArray.get(guildId).rawSet;
        return arr.find(value => value.userId === userId);
    }

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("Link cooldown", message);
    }
}

class LinkCooldownEntry {

    public messageArray: Message[] = [];

    public constructor(public userId: string) {
    }
}
