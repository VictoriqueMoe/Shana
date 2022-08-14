import type {FilterSettings, IAutoModFilter} from "./IAutoModFilter.js";

export type ValueBackedFilterSettings = FilterSettings & {
    value?: unknown
};

/**
 * This filter is backed by a value
 */
export interface IValueBackedAutoModFilter<T> extends IAutoModFilter {

    /**
     * Some filters have additional values for settings, this will return the unique setting for this filter
     */
    value(guildId: string): Promise<T>;
}
