import {ACTION} from "../../enums/ACTION";
import {IValueBackedMessageGateKeeperFilter} from "../../modules/automod/IValueBackedMessageGateKeeperFilter";
import {Message} from "discord.js";
import {CooldownArray} from "../CooldownArray";
import isURL from "isurl";
import {AbstractFilter} from "./AbstractFilter";

export class LinkCooldown extends AbstractFilter implements IValueBackedMessageGateKeeperFilter {
    private cooldownArray: CooldownArray;

    public constructor() {
        super();
        this.cooldownArray = new CooldownArray(Number.parseInt(this.value));
    }

    public get actions(): ACTION[] {
        return [ACTION.DELETE, ACTION.MUTE];
    }

    public get isActive(): boolean {
        return true;
    }

    public get value(): string {
        return "5"; // hard coded for now
    }

    public doFilter(content: Message): boolean {
        const messageContent = content.content;
        const isUrl: boolean = isURL(messageContent);
        if (!isUrl) {
            return true;
        }
        const memberId = content.member.id;
        const isInMap = this.cooldownArray.isUserInCooldown(memberId);
        if (!isInMap) {
            this.cooldownArray.push(memberId);
            return true;
        }
        this.cooldownArray.refreshUser(memberId);
        return false;
    }

    public get id(): string {
        return "Link Cooldown";
    }

    public get warnMessage(): string {
        return "Stop sending so many links";
    }
}