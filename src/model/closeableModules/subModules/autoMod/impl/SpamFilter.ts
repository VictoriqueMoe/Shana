import {AbstractFilter} from "../AbstractFilter.js";
import {Message} from "discord.js";
import {singleton} from "tsyringe";
import {SpamMeta} from "discord-spams";
import {RunEvery} from "../../../../framework/decorators/RunEvery.js";
import ACTION from "../../../../../enums/ACTION.js";
import PRIORITY from "../../../../../enums/PRIORITY.js";

@singleton()
export class SpamFilter extends AbstractFilter {

    public constructor() {
        super();
        this.update();
    }

    public get actions(): ACTION[] {
        return [ACTION.WARN, ACTION.DELETE, ACTION.MUTE];
    }

    public get isActive(): boolean {
        return true;
    }

    public get id(): string {
        return "Spam Filter";
    }

    public get warnMessage(): string {
        return `Your URL has matched a potential spam link, your message has been deleted and you have been muted`;
    }

    public get priority(): number {
        return PRIORITY.LAST;
    }

    public override get autoTerminalViolationCount(): number {
        return 1;
    }

    public async doFilter(message: Message): Promise<boolean> {
        const content = message.content;
        if (content.startsWith("https://discord.gift")) {
            return true;
        }
        return !SpamMeta.isSpam(message.content);
    }

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("spam", message);
    }

    @RunEvery(3, "hours")
    private update(): Promise<void> {
        return SpamMeta.refreshMasterList();
    }

}
