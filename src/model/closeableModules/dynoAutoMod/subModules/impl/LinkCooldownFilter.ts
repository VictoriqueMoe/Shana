import {AbstractFilter} from "../AbstractFilter";
import {ACTION} from "../../../../../enums/ACTION";
import {Message} from "discord.js";
import {InjectDynoSubModule} from "../../../../decorators/InjectDynoSubModule";
import {PRIORITY} from "../../../../../enums/PRIORITY";
import {DynoAutoMod} from "../../../../../events/closeableModules/DynoAutoMod";
import {IValueBackedDynoAutoModFilter} from "../IValueBackedDynoAutoModFilter";
import {TimedSet} from "../../../../Impl/TimedSet";
import {ICloseableModule} from "../../../ICloseableModule";

const getUrls = require('get-urls');

@InjectDynoSubModule(DynoAutoMod)
export class LinkCooldownFilter extends AbstractFilter implements IValueBackedDynoAutoModFilter {
    private _cooldownArray: TimedSet<LinkCooldownEntry>;

    private constructor(parentFilter: ICloseableModule) {
        super(parentFilter);
        this._cooldownArray = new TimedSet(Number.parseInt(this.value) * 1000);
    }

    public get actions(): ACTION[] {
        return [ACTION.DELETE, ACTION.WARN];
    }

    public get isActive(): boolean {
        return true;
    }

    /**
     * The time between links
     */
    public get value(): string {
        return "5"; // hard coded for now
    }

    public doFilter(content: Message): boolean {
        const messageContent = content.content;
        const urls = getUrls(messageContent);
        if (urls && urls.size > 0) {
            const memberId = content.member.id;
            const guildId = content.member.guild.id;
            let fromArray = this.getFromArray(memberId, guildId);
            if (!fromArray) {
                fromArray = new LinkCooldownEntry(memberId, guildId);
                this._cooldownArray.add(fromArray);
                return true;
            }
            this._cooldownArray.refresh(fromArray);
            return false;
        }
        return true;
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

    private getFromArray(userId: string, guildId: string): LinkCooldownEntry {
        const arr = this._cooldownArray.rawSet;
        return arr.find(value => value.userId === userId && value.guildId === guildId);
    }
}

class LinkCooldownEntry {
    constructor(public userId: string, public guildId: string) {
    }
}