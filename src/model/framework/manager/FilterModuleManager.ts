import {container, delay, singleton} from "tsyringe";
import {DataSourceAware} from "../../DB/DAO/DataSourceAware.js";
import {Client} from "discordx";
import * as Immutable from "immutable";
import type {FilterSettings, IAutoModFilter} from "../../closeableModules/subModules/autoMod/IAutoModFilter.js";
import {FilterModuleModel} from "../../DB/entities/autoMod/impl/subModules/impl/AutoMod/FilterModule.model.js";
import {DbUtils, ObjectUtil} from "../../../utils/Utils.js";
import {
    ValueBackedFilterModuleModel
} from "../../DB/entities/autoMod/impl/subModules/impl/AutoMod/ValueBackedFilterModule.model.js";
import {
    BannedWordFilterModuleModel
} from "../../DB/entities/autoMod/impl/subModules/impl/AutoMod/BannedWordFilterModule.model.js";
import type {
    BannedWordFilterSettings,
    IBannedWordAutoModFilter
} from "../../closeableModules/subModules/autoMod/IBannedWordAutoModFilter.js";
import type {
    IValueBackedAutoModFilter,
    ValueBackedFilterSettings
} from "../../closeableModules/subModules/autoMod/IValueBackedAutoModFilter.js";
import {SubModuleManager} from "./SubModuleManager.js";
import {AbstractFilter} from "../../closeableModules/subModules/autoMod/AbstractFilter.js";
import {AutoMod} from "../../../events/managed/closeableModules/AutoMod.js";
import {FindOneOptions} from "typeorm/find-options/FindOneOptions.js";
import {RunEvery} from "../decorators/RunEvery.js";
import logger from "../../../utils/LoggerFactory.js";

export type UnionSettings = FilterSettings | BannedWordFilterSettings | ValueBackedFilterSettings;

@singleton()
export class FilterModuleManager extends DataSourceAware {

    private readonly _subModuleManager: SubModuleManager;

    public constructor() {
        super();
        this._subModuleManager = container.resolve(delay(() => SubModuleManager));
    }


    public async initDefaults(client: Client): Promise<void> {
        const guilds = client.guilds;
        const cache = guilds.cache;
        const newModels: (FilterModuleModel | ValueBackedFilterModuleModel | BannedWordFilterModuleModel)[] = [];
        await this._ds.transaction(async entityManager => {
            for (const [guildId] of cache) {
                for (const filter of this.filters) {
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
        await container.resolve(AutoMod).init(client);
    }

    public async getAllSettings(guildId: string): Promise<(FilterModuleModel | ValueBackedFilterModuleModel | BannedWordFilterModuleModel)[]> {
        const bannedWordRepo = this._ds.getRepository(BannedWordFilterModuleModel);
        const filterRepo = this._ds.getRepository(FilterModuleModel);
        const valueRepo = this._ds.getRepository(ValueBackedFilterModuleModel);
        const repoArr = [bannedWordRepo, filterRepo, valueRepo];
        return Promise.all(repoArr.map(repo => repo.find({
            cache: {
                id: `${repo.metadata.name}_settings`,
                milliseconds: 30000
            },
            where: {guildId}
        }))).then(values => values.flat());
    }

    public async getModel(guildId: string, filter: IAutoModFilter): Promise<FilterModuleModel | ValueBackedFilterModuleModel | BannedWordFilterModuleModel | null> {
        const allModels = await this.getAllSettings(guildId);
        return allModels.filter(model => model.pSubModuleId === filter.id)?.[0];
    }

    public async getSetting(guildId: string, filter: IAutoModFilter): Promise<UnionSettings> {
        let res: FilterModuleModel | ValueBackedFilterModuleModel | BannedWordFilterModuleModel = null;
        const opts: FindOneOptions<FilterModuleModel | ValueBackedFilterModuleModel | BannedWordFilterModuleModel> = {
            relations: ["subModule"],
            where: {
                guildId,
                pSubModuleId: filter.id
            }
        };
        if (this.isBannedWordAutoModFilter(filter)) {
            opts["cache"] = {
                id: "bannedWordSetting_query",
                milliseconds: 30000
            };
            res = await this._ds.manager.findOne(BannedWordFilterModuleModel, opts);
        } else if (this.isValueBackedAutoModFilter(filter)) {
            opts["cache"] = {
                id: "valueBackedSetting_query",
                milliseconds: 30000
            };
            res = await this._ds.manager.findOne(ValueBackedFilterModuleModel, opts);
        } else {
            opts["cache"] = {
                id: "FilterSetting_query",
                milliseconds: 30000
            };
            res = await this._ds.manager.findOne(FilterModuleModel, opts);
        }
        return res?.getSettings();
    }


    public isBannedWordAutoModFilter(filter: IAutoModFilter): filter is IBannedWordAutoModFilter {
        return 'bannedWords' in filter;
    }

    @RunEvery(1, "hours", true)
    private update(): Promise<void> {
        logger.info("Clearning cache for 'settings_query' and 'filter_query'");
        return this._ds.queryResultCache.remove([
            "BannedWordFilterModuleModel_settings",
            "FilterModuleModel_settings",
            "ValueBackedFilterModuleModel_settings",
            "bannedWordSetting_query",
            "FilterSetting_query",
            "valueBackedSetting_query"]);
    }

    public isValueBackedAutoModFilter(filter: IAutoModFilter): filter is IValueBackedAutoModFilter<unknown> {
        return 'value' in filter;
    }

    public get filters(): Immutable.Set<IAutoModFilter> {
        return this._subModuleManager.subModules.filter(subModule => subModule instanceof AbstractFilter) as Immutable.Set<IAutoModFilter>;
    }
}
