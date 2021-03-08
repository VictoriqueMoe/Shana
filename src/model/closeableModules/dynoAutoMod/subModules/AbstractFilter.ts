import {IDynoAutoModFilter} from "./IDynoAutoModFilter";
import {Message} from "discord.js";
import {SubModuleManager} from "./manager/SubModuleManager";
import {ACTION} from "../../../../enums/ACTION";
import {ICloseableModule} from "../../ICloseableModule";

export abstract class AbstractFilter implements IDynoAutoModFilter {

    protected constructor(protected _parentModule: ICloseableModule) {
        SubModuleManager.instance.addSubModules(this);
    }

    public get parentModule(): ICloseableModule {
        return this._parentModule;
    }

    /**
     * this sets the amount of filters that define "mute" as punishment that needs to fail before they are muted automatically by the set autoMuteTimeout value
     */
    public static get autoMuteViolationCount(): number {
        return 3; //  hard-coded for now
    }

    /**
     * How long (in seconds) are members muted for if they violate "mute" filters according to the autoMuteViolationCount
     */
    public static get autoMuteTimeout(): number {
        return 300; //  hard-coded for now
    }

    /**
     * How long to wait (in seconds) to cooldown the autoMuteViolationCount value
     * <br/><br/>
     * if autoMuteViolationCount is set to 2 and this is set to 30 then each member will have 30 seconds to violate 2 MUTE filters starting from the first violation. If a member violates ONE mute role and not another within 30 seconds, then then the counter is reset to 0
     *
     */
    public static get muteViolationTimeout(): number {
        return 15; //  hard-coded for now
    }

    // eslint-disable-next-line no-undef
    abstract readonly actions: ACTION[];
    abstract readonly id: string;
    abstract readonly isActive: boolean;
    abstract readonly warnMessage: string;

    abstract doFilter(content: Message): boolean;

    abstract readonly priority: number;
}