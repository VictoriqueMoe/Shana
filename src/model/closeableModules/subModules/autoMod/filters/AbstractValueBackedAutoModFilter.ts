import {AbstractFilter} from "./AbstractFilter.js";
import {Message} from "discord.js";
import {IValueBackedAutoModFilter, ValueBackedFilterSettings} from "./IValueBackedAutoModFilter.js";
import {ObjectUtil} from "../../../../../utils/Utils.js";
import {Awaitable} from "discordx";

export abstract class AbstractValueBackedAutoModFilter<T> extends AbstractFilter implements IValueBackedAutoModFilter<T> {
    public abstract override readonly id: string;
    protected abstract readonly defaultValue: T;

    public abstract override doFilter(content: Message): Awaitable<boolean>;

    public value(guildId: string): Promise<T> {
        return this._filterManager.getSetting(guildId, this).then((setting: ValueBackedFilterSettings) => {
            if (!setting) {
                return this.defaultValue;
            }
            return ObjectUtil.validString(setting.value) ? this.unMarshalData(setting.value as string) : this.defaultValue;
        });
    }

    protected abstract unMarshalData(data: string): T;
}
