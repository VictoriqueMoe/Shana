import {IMessageGateKeeperFilter} from "../../modules/automod/IMessageGateKeeperFilter";
import {Message} from "discord.js";
import {ACTION} from "../../enums/ACTION";

export abstract class AbstractFilter implements IMessageGateKeeperFilter{

    /**
     *  Get the number of filter violations needed in order to activate a mute if the filter defines a punishment as mute
     */
    public get autoMuteVoilationCount(): number {
        return 3; //  hard-coded for now
    }

    // eslint-disable-next-line no-undef
    abstract readonly actions: ACTION[];
    abstract readonly id: string;
    abstract readonly isActive: boolean;
    abstract readonly warnMessage: string;

    abstract doFilter(content: Message);
}