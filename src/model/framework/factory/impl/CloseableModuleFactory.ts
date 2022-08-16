import {AbstractFactory} from "../AbstractFactory.js";
import type {ICloseableModule} from "../../../closeableModules/ICloseableModule.js";
import {Beans} from "../../DI/Beans.js";
import {injectAll, registry, singleton} from "tsyringe";
import {AutoMod} from "../../../../events/managed/closeableModules/AutoMod.js";
import {AutoResponder} from "../../../../events/managed/closeableModules/AutoResponder.js";
import {AutoRole} from "../../../../events/djxManaged/closeableModules/AutoRole.js";
import {MemberLogger} from "../../../../events/djxManaged/closeableModules/logging/admin/MemberLogger.js";
import {AuditLogger} from "../../../../events/djxManaged/closeableModules/logging/mod/AuditLogger.js";
import {RoleLogger} from "../../../../events/djxManaged/closeableModules/logging/admin/RoleLogger.js";
import {MessageLogger} from "../../../../events/djxManaged/closeableModules/logging/admin/MessageLogger.js";
import {ChannelLogger} from "../../../../events/djxManaged/closeableModules/logging/admin/ChannelLogger.js";

@singleton()
@registry([
    {token: Beans.ICloseableModuleToken, useToken: AuditLogger},
    {token: Beans.ICloseableModuleToken, useToken: AutoMod},
    {token: Beans.ICloseableModuleToken, useToken: RoleLogger},
    {token: Beans.ICloseableModuleToken, useToken: MemberLogger},
    {token: Beans.ICloseableModuleToken, useToken: ChannelLogger},
    {token: Beans.ICloseableModuleToken, useToken: MessageLogger},
    {token: Beans.ICloseableModuleToken, useToken: AutoRole},
    {token: Beans.ICloseableModuleToken, useToken: AutoResponder}
])
export class CloseableModuleFactory extends AbstractFactory<ICloseableModule<unknown>> {
    public constructor(@injectAll(Beans.ICloseableModuleToken) beans: ICloseableModule<unknown>[]) {
        super(beans);
    }
}
