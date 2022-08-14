import {AbstractFilter} from "../AbstractFilter.js";
import {Message} from "discord.js";
import {IValueBackedAutoModFilter} from "../IValueBackedAutoModFilter.js";
import {
    ValueBackedFilterModuleModel
} from "../../../../DB/entities/autoMod/impl/subModules/impl/AutoMod/ValueBackedFilterModule.model.js";
import {ObjectUtil} from "../../../../../utils/Utils.js";

export abstract class AbstractValueBackedAutoModFilter<T> extends AbstractFilter implements IValueBackedAutoModFilter<T> {
    public abstract override readonly id: string;

    public abstract override postProcess(member: Message): Promise<void>;

    public abstract override doFilter(content: Message): Promise<boolean>;

    public abstract readonly defaultValue: T;

    public abstract unMarshalData(data: string): T;

    public value(guildId: string): Promise<T> {
        return this._filterManager.getSetting(guildId, this).then((setting: ValueBackedFilterModuleModel) => ObjectUtil.validString(setting.value) ? this.unMarshalData(setting.value) : this.defaultValue);
    }
}
