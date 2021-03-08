import {IValueBackedMessageGateKeeperFilter} from "../IValueBackedMessageGateKeeperFilter";
import {AbstractFilter} from "../AbstractFilter";
import {TimedSet} from "../../../../../Impl/TimedSet";
import {ACTION} from "../../../../../../enums/ACTION";
import {Message} from "discord.js";
import {InjectDynoSubModule} from "../../../../../decorators/InjectDynoSubModule";
import {PRIORITY} from "../../../../../../enums/PRIORITY";
import {MessageGateKeeper} from "../../../../../../events/closeableModules/MessageGateKeeper";
import {ICloseableModule} from "../../../../ICloseableModule";

const getUrls = require('get-urls');

@InjectDynoSubModule(MessageGateKeeper)
export class LinkCooldownFilter extends AbstractFilter implements IValueBackedMessageGateKeeperFilter {
    private _cooldownArray: TimedSet<string>;

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
            const isInMap = this._cooldownArray.has(memberId);
            if (!isInMap) {
                this._cooldownArray.add(memberId);
                return true;
            }
            this._cooldownArray.refresh(memberId);
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
}