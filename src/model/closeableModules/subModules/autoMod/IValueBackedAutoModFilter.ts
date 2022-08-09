import type {IAutoModFilter} from "./IAutoModFilter.js";

/**
 * This filter is backed by a value
 */
export interface IValueBackedAutoModFilter<T> extends IAutoModFilter {

    /**
     * Some filters have additional values for settings, this will return the unique setting for this filter
     */
    readonly value: T;
}
