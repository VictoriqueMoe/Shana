import {singleton} from "tsyringe";
import {DataSourceAware} from "../../DB/DAO/DataSourceAware.js";
import {Client} from "discordx";
import {PostConstruct} from "../decorators/PostConstruct.js";
import {SubModuleManager} from "./SubModuleManager.js";
import * as Immutable from "immutable";
import {IAutoModFilter} from "../../closeableModules/subModules/autoMod/IAutoModFilter.js";
import {AbstractFilter} from "../../closeableModules/subModules/autoMod/AbstractFilter.js";

@singleton()
export class FilterModuleManager extends DataSourceAware {

    private readonly _filters: Immutable.Set<IAutoModFilter>;

    public constructor(private _subModuleManager: SubModuleManager) {
        super();
        this._filters = _subModuleManager.subModules.filter(subModule => subModule instanceof AbstractFilter) as Immutable.Set<IAutoModFilter>;
    }

    @PostConstruct
    public async initDefaults(client: Client): Promise<void> {
    }

    public get filters(): Immutable.Set<IAutoModFilter> {
        return this._filters;
    }
}
