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
import {getInstanceCashingSingletonFactory} from "../../DI/moduleRegistrar.js";

@singleton()
@registry([
    {token: Beans.ICloseableModuleToken, useFactory: getInstanceCashingSingletonFactory(AuditLogger)},
    {token: Beans.ICloseableModuleToken, useFactory: getInstanceCashingSingletonFactory(AutoMod)},
    {token: Beans.ICloseableModuleToken, useFactory: getInstanceCashingSingletonFactory(RoleLogger)},
    {token: Beans.ICloseableModuleToken, useFactory: getInstanceCashingSingletonFactory(MemberLogger)},
    {token: Beans.ICloseableModuleToken, useFactory: getInstanceCashingSingletonFactory(ChannelLogger)},
    {token: Beans.ICloseableModuleToken, useFactory: getInstanceCashingSingletonFactory(MessageLogger)},
    {token: Beans.ICloseableModuleToken, useFactory: getInstanceCashingSingletonFactory(AutoRole)},
    {token: Beans.ICloseableModuleToken, useFactory: getInstanceCashingSingletonFactory(AutoResponder)}
])
export class CloseableModuleFactory extends AbstractFactory<ICloseableModule<unknown>> {
    public constructor(@injectAll(Beans.ICloseableModuleToken) beans: ICloseableModule<unknown>[]) {
        super(beans);
    }
}
