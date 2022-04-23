import {AbstractFactory} from "./AbstractFactory";
import type {ICloseableModule} from "../../closeableModules/ICloseableModule";
import Immutable from "immutable";
import {container, registry, singleton} from "tsyringe";
import {Beans} from "../../../DI/Beans";
import {AuditLogger} from "../../../events/closeableModules/logging/mod/AuditLogger";
import {DynoAutoMod} from "../../../managedEvents/messageEvents/closeableModules/DynoAutoMod";
import {RoleLogger} from "../../../events/closeableModules/logging/admin/RoleLogger";
import {MemberLogger} from "../../../events/closeableModules/logging/admin/MemberLogger";
import {ChannelLogger} from "../../../events/closeableModules/logging/admin/ChannelLogger";
import {MessageLogger} from "../../../events/closeableModules/logging/admin/MessageLogger";
import {AutoRole} from "../../../events/closeableModules/autoRole/AutoRole";
import {AutoResponder} from "../../../managedEvents/messageEvents/closeableModules/AutoResponder";

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
export class CloseableModuleFactory extends AbstractFactory<ICloseableModule<unknown>> {

    protected populateEngines(): Immutable.Set<ICloseableModule<unknown>> {
        return Immutable.Set(container.resolveAll(Beans.ICloseableModuleToken));
    }

}
