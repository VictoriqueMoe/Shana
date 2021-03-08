import {IDynoAutoModFilter} from "./IDynoAutoModFilter";

/**
 * This filter is backed by a value
 */
export interface IValueBackedDynoAutoModFilter extends IDynoAutoModFilter {

    /**
     * Some filters have additional values for settings, this will return the unique setting for this filter
     */
    readonly value: string;
}