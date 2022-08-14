import {singleton} from "tsyringe";
import {DataSourceAware} from "../../DB/DAO/DataSourceAware.js";
import {Client} from "discordx";
import {SubModuleManager} from "./SubModuleManager.js";
import * as Immutable from "immutable";
import {IAutoModFilter} from "../../closeableModules/subModules/autoMod/IAutoModFilter.js";
import {AbstractFilter} from "../../closeableModules/subModules/autoMod/AbstractFilter.js";
import {FilterModuleModel} from "../../DB/entities/autoMod/impl/subModules/impl/AutoMod/FilterModule.model.js";
import {DbUtils, ObjectUtil} from "../../../utils/Utils.js";
import {
    ValueBackedFilterModuleModel
} from "../../DB/entities/autoMod/impl/subModules/impl/AutoMod/ValueBackedFilterModule.model.js";
import {
    BannedWordFilterModuleModel
} from "../../DB/entities/autoMod/impl/subModules/impl/AutoMod/BannedWordFilterModule.model.js";
import {IBannedWordAutoModFilter} from "../../closeableModules/subModules/autoMod/IBannedWordAutoModFilter.js";
import {IValueBackedAutoModFilter} from "../../closeableModules/subModules/autoMod/IValueBackedAutoModFilter.js";

@singleton()
export class FilterModuleManager extends DataSourceAware {

    private readonly _filters: Immutable.Set<IAutoModFilter>;

    public constructor(private _subModuleManager: SubModuleManager) {
        super();
        this._filters = _subModuleManager.subModules.filter(subModule => subModule instanceof AbstractFilter) as Immutable.Set<IAutoModFilter>;
    }

    public async initDefaults(client: Client): Promise<void> {
        const guilds = client.guilds;
        const cache = guilds.cache;
        const newModels: (FilterModuleModel | ValueBackedFilterModuleModel | BannedWordFilterModuleModel)[] = [];
        await this._ds.transaction(async entityManager => {
            for (const [guildId] of cache) {
                for (const filter of this._filters) {
                    const pSubModuleId = filter.id;
                    const data = {
                        pSubModuleId,
                        guildId
                    };
                    if (filter) {
                        if (this.isBannedWordAutoModFilter(filter)) {
                            if (await entityManager.count(BannedWordFilterModuleModel, {where: data}) === 0) {
                                newModels.push(DbUtils.build(BannedWordFilterModuleModel, {...data}));
                            }
                        } else if (this.isValueBackedAutoModFilter(filter)) {
                            if (await entityManager.count(ValueBackedFilterModuleModel, {where: data}) === 0) {
                                newModels.push(DbUtils.build(ValueBackedFilterModuleModel, {...data}));
                            }
                        } else {
                            if (await entityManager.count(FilterModuleModel, {where: data}) === 0) {
                                newModels.push(DbUtils.build(FilterModuleModel, {...data}));
                            }
                        }
                    }
                }
            }
            if (ObjectUtil.isValidArray(newModels)) {
                await entityManager.save(newModels);
            }
        });
    }

    public async getAllSettings(guildId: string): Promise<(FilterModuleModel | ValueBackedFilterModuleModel | BannedWordFilterModuleModel)[]> {
        const bannedWordRepo = this._ds.getRepository(BannedWordFilterModuleModel);
        const filterRepo = this._ds.getRepository(FilterModuleModel);
        const valueRepo = this._ds.getRepository(ValueBackedFilterModuleModel);
        const repoArr = [bannedWordRepo, filterRepo, valueRepo];
        return Promise.all(repoArr.map(repo => repo.find({where: {guildId}}))).then(values => values.flat());
    }

    public async getSetting(guildId: string, filter: IAutoModFilter): Promise<FilterModuleModel | ValueBackedFilterModuleModel | BannedWordFilterModuleModel> {
        let res: FilterModuleModel | ValueBackedFilterModuleModel | BannedWordFilterModuleModel = null;
        if (this.isBannedWordAutoModFilter(filter)) {
            res = await this._ds.manager.findOne(BannedWordFilterModuleModel, {
                where: {
                    guildId,
                    pSubModuleId: filter.id
                }
            });
        } else if (this.isValueBackedAutoModFilter(filter)) {
            res = await this._ds.manager.findOne(ValueBackedFilterModuleModel, {
                where: {
                    guildId,
                    pSubModuleId: filter.id
                }
            });
        } else {
            res = await this._ds.manager.findOne(FilterModuleModel, {
                where: {
                    guildId,
                    pSubModuleId: filter.id
                }
            });
        }
        return res;
    }

    public isBannedWordAutoModFilter(filter: IAutoModFilter): filter is IBannedWordAutoModFilter {
        return 'bannedWords' in filter;
    }

    public isValueBackedAutoModFilter(filter: IAutoModFilter): filter is IValueBackedAutoModFilter<unknown> {
        return 'value' in filter;
    }

    public get filters(): Immutable.Set<IAutoModFilter> {
        return this._filters;
    }
}
