import {IMessageGateKeeperFilter} from "./IMessageGateKeeperFilter";

/**
 * This filter is backed by a value
 */
export interface IValueBackedMessageGateKeeperFilter extends IMessageGateKeeperFilter {

    /**
     * Some filters have additional values for settings, this will return the unique setting for this filter
     */
    readonly value: string;
}