import {AbstractFilter} from "../AbstractFilter";
import {ACTION} from "../../../../../enums/ACTION";
import {Message} from "discord.js";
import {PRIORITY} from "../../../../../enums/PRIORITY";
import {singleton} from "tsyringe";
import {SpamMeta} from "discord-spams";
import {RunEvery} from "../../../../decorators/RunEvery";
import {TimeUtils} from "../../../../../utils/Utils";

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
        return !SpamMeta.isSpam(message.content);
    }

    public async postProcess(message: Message): Promise<void> {
        await super.postToLog("spam", message);
    }

    @RunEvery(3, TimeUtils.METHOD_EXECUTOR_TIME_UNIT.hours)
    private update(): Promise<void> {
        return SpamMeta.refreshMasterList();
    }

}
