import {AbstractFactory} from "../AbstractFactory.js";
import {ICloseableModule} from "../../../closeableModules/ICloseableModule.js";
import {Beans} from "../../DI/Beans.js";
import {injectAll, registry, singleton} from "tsyringe";
import {AutoResponder} from "../../../../events/managed/closeableModules/AutoResponder.js";
import {AutoRole} from "../../../../events/managed/closeableModules/AutoRole.js";
import {AutoMod} from "../../../../events/managed/closeableModules/AutoMod.js";


@singleton()
@registry([
  //  {token: Beans.ICloseableModuleToken, useToken: AuditLogger},
    {token: Beans.ICloseableModuleToken, useToken: AutoMod},
    /*  {token: Beans.ICloseableModuleToken, useToken: RoleLogger},
     {token: Beans.ICloseableModuleToken, useToken: MemberLogger},
     {token: Beans.ICloseableModuleToken, useToken: ChannelLogger},
     {token: Beans.ICloseableModuleToken, useToken: MessageLogger}, */
    {token: Beans.ICloseableModuleToken, useToken: AutoRole},
    {token: Beans.ICloseableModuleToken, useToken: AutoResponder}
])
export class CloseableModuleFactory extends AbstractFactory<ICloseableModule<unknown>> {
    public constructor(@injectAll(Beans.ICloseableModuleToken) beans: ICloseableModule<unknown>[]) {
        super(beans);
    }
}
