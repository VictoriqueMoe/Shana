import {Message} from "discord.js";
import {singleton} from "tsyringe";
import {ObjectUtil} from "../../../../../utils/Utils.js";
import {TimedSet} from "@discordx/utilities";
import {AbstractValueBackedAutoModFilter} from "./AbstractValueBackedAutoModFilter.js";
import {PostConstruct} from "../../../../framework/decorators/PostConstruct.js";
import {Client} from "discordx";

@singleton()
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

    @PostConstruct
    public async init(clinet: Client): Promise<void> {
        for (const [guildId] of clinet.guilds.cache) {
            const value = await this.value(guildId) * 1000;
            this._cooldownArray.set(guildId, new TimedSet(value));
        }
    }

    /**
     * The time between links
     */
    public unMarshalData(data: string): number {
        return Number.parseInt(data);
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
        return arr.find(value => value.userId === userId && value.guildId === guildId);
    }

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("Link cooldown", message);
    }
}

class LinkCooldownEntry {

    public messageArray: Message[] = [];

    public constructor(public userId: string, public guildId: string) {
    }
}
