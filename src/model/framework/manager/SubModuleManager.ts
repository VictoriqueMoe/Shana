import * as Immutable from 'immutable';
import {singleton} from "tsyringe";
import {ModuleSettings} from "../../closeableModules/settings/ModuleSettings.js";
import {ICloseableModule} from "../../closeableModules/ICloseableModule.js";
import {ISubModule} from "../../closeableModules/subModules/ISubModule.js";
import {SubModuleFactory} from "../factory/impl/SubModuleFactory.js";
import {Client} from "discordx";
import {DbUtils, ObjectUtil} from "../../../utils/Utils.js";
import {SubModuleModel} from "../../DB/entities/autoMod/impl/subModules/impl/SubModule.model.js";
import {DataSourceAware} from "../../DB/DAO/DataSourceAware.js";

@singleton()
export class SubModuleManager extends DataSourceAware {

    private readonly _subModules: Immutable.Set<ISubModule>;

    public constructor(subModuleFactory: SubModuleFactory) {
        super();
        this._subModules = subModuleFactory.engines;
    }

    public get subModules(): Immutable.Set<ISubModule> {
        return Immutable.Set.of(...this._subModules.values());
    }

    public getSubModulesFromParent(parent: ICloseableModule<ModuleSettings>): Immutable.Set<ISubModule> {
        const returnSet: Set<ISubModule> = new Set();
        for (const subModule of this._subModules) {
            const subModuleParentId = subModule.parentModuleId;
            if (subModuleParentId === parent.moduleId) {
                returnSet.add(subModule);
            }
        }
        return Immutable.Set(returnSet);
    }

    public getSubModule<T extends ISubModule>(subModuleId: string): T {
        return this.subModules.find(value => value.id === subModuleId) as T;
    }

    public async setActive(guildId: string, subModuleId: string, isActive: boolean): Promise<void> {
        const repo = this.ds.getRepository(SubModuleModel);
        await repo.update({
            guildId,
            subModuleId
        }, {
            isActive
        });
    }

    public async initDefaults(client: Client): Promise<void> {
        const guilds = client.guilds;
        const cache = guilds.cache;
        const repo = this.ds.getRepository(SubModuleModel);
        const newModels: SubModuleModel[] = [];
        for (const [guildId] of cache) {
            for (const subModule of this._subModules) {
                const subModuleId = subModule.id;
                if (await repo.count({
                    where: {
                        subModuleId,
                        guildId
                    }
                }) === 0) {
                    const pModuleId = subModule.parentModuleId;
                    newModels.push(DbUtils.build(SubModuleModel, {
                        subModuleId,
                        pModuleId,
                        guildId
                    }));
                }
            }
        }
        if (ObjectUtil.isValidArray(newModels)) {
            await repo.save(newModels);
        }
    }

}
