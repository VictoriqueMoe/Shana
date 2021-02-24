import {IMessageGateKeeperFilter} from "./IMessageGateKeeperFilter";

/**
 * This filter is backed by a value
 */
export interface IValueBackedMessageGateKeeperFilter extends IMessageGateKeeperFilter {

    /**
     * get the value
     */
    readonly value: string;
}