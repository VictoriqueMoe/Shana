import {container, injectAll, registry, singleton} from "tsyringe";
import {Beans} from "../../../DI/Beans";
import {AuditLogger} from "../../../events/closeableModules/logging/mod/AuditLogger";
import {DynoAutoMod} from "../../../managedEvents/messageEvents/closeableModules/DynoAutoMod";
import {RoleLogger} from "../../../events/closeableModules/logging/admin/RoleLogger";
import {MemberLogger} from "../../../events/closeableModules/logging/admin/MemberLogger";
import {ChannelLogger} from "../../../events/closeableModules/logging/admin/ChannelLogger";
import {MessageLogger} from "../../../events/closeableModules/logging/admin/MessageLogger";
import {AutoRole} from "../../../events/closeableModules/autoRole/AutoRole";
import {AutoResponder} from "../../../managedEvents/messageEvents/closeableModules/AutoResponder";
import {ICloseableModule} from "../../closeableModules/ICloseableModule";
import Immutable from "immutable";
import {constructor} from "tsyringe/dist/typings/types";
import {PostConstruct} from "../../decorators/PostConstruct";
import {ISubModule} from "../../closeableModules/subModules/ISubModule";
import {AbstractFilter} from "../../closeableModules/subModules/dynoAutoMod/AbstractFilter";

@registry([
    {token: Beans.ICloseableModuleToken, useToken: AuditLogger},
    {token: Beans.ICloseableModuleToken, useToken: DynoAutoMod},
    {token: Beans.ICloseableModuleToken, useToken: RoleLogger},
    {token: Beans.ICloseableModuleToken, useToken: MemberLogger},
    {token: Beans.ICloseableModuleToken, useToken: ChannelLogger},
    {token: Beans.ICloseableModuleToken, useToken: MessageLogger},
    {token: Beans.ICloseableModuleToken, useToken: AutoRole},
    {token: Beans.ICloseableModuleToken, useToken: AutoResponder}
])
@singleton()
export class CloseableModuleManager {

    private readonly _closeableModules: Set<ICloseableModule<unknown>>;

    public constructor(@injectAll(Beans.ICloseableModuleToken) modules: ICloseableModule<unknown>[]) {
        this._closeableModules = new Set(modules);
    }

    public get closeableModules(): Immutable.Set<ICloseableModule<unknown>> {
        return Immutable.Set.of(...this._closeableModules.values());
    }

    public getCloseableModule<F, T extends ICloseableModule<F>>(closeableModule: constructor<T>): T {
        return this.closeableModules.find(value => value.constructor === closeableModule) as T;
    }

    public getModule(moduleId: string): ICloseableModule<any> {
        const modules = this.closeableModules;
        for (const module of modules) {
            if (module.moduleId === moduleId) {
                return module;
            }
        }
        return null;
    }

    @PostConstruct
    private init(): void {
        container.afterResolution(
            Beans.ISubModuleToken,
            (_t, result: ISubModule[], resolutionType) => {
                const dynoAutoMod = this.getCloseableModule(DynoAutoMod);
                for (const subModule of result) {
                    if (subModule instanceof AbstractFilter) {
                        console.log(`Registering submodule ${subModule.id} with parent module ${dynoAutoMod.constructor.name}`);
                        subModule.parentModule = dynoAutoMod;
                    }
                }
            },
            {
                frequency: "Once"
            }
        );
    }

}
