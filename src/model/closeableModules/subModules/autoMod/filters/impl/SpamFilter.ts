import {AbstractFilter} from "../AbstractFilter.js";
import {Message} from "discord.js";
import {SpamMeta} from "discord-spams";
import {RunEvery} from "../../../../../framework/decorators/RunEvery.js";

export class SpamFilter extends AbstractFilter {

    public constructor() {
        super();
        this.update();
    }

    public get id(): string {
        return "Spam Filter";
    }

    public doFilter(message: Message): boolean {
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
