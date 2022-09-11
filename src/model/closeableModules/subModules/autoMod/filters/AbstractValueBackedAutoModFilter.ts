import {AbstractFilter} from "./AbstractFilter.js";
import {Message} from "discord.js";
import {IValueBackedAutoModFilter, ValueBackedFilterSettings} from "./IValueBackedAutoModFilter.js";
import {ObjectUtil} from "../../../../../utils/Utils.js";

export abstract class AbstractValueBackedAutoModFilter<T> extends AbstractFilter implements IValueBackedAutoModFilter<T> {
    public abstract override readonly id: string;
    public abstract readonly defaultValue: T;

    public abstract override postProcess(member: Message): Promise<void>;

    public abstract override doFilter(content: Message): Promise<boolean>;

    public abstract unMarshalData(data: string): T;

    public value(guildId: string): Promise<T> {
        return this._filterManager.getSetting(guildId, this).then((setting: ValueBackedFilterSettings) => {
            if (!setting) {
                return this.defaultValue;
            }
            return ObjectUtil.validString(setting.value) ? this.unMarshalData(setting.value as string) : this.defaultValue;
        });
    }
}
