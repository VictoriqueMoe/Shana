import {AbstractFilter} from "../AbstractFilter.js";
import {Message} from "discord.js";
import {ObjectUtil} from "../../../../../../utils/Utils.js";

export class ZalgoTextFilter extends AbstractFilter {

    public get id(): string {
        return "Zalgo Text Filter";
    }

    public doFilter(content: Message): boolean {
        const message = content.content;
        if (!ObjectUtil.validString(message)) {
            return true;
        }
        return !this.hasZalgo(message);
    }

    private hasZalgo(txt: string): boolean {
        const re = /%CC%/g;
        return re.test(encodeURIComponent(txt));
    }
}
