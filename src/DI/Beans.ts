import {registry} from "tsyringe";
import {ZalgoTextFilter} from "../model/closeableModules/subModules/dynoAutoMod/impl/ZalgoTextFilter";
import {ScamFilter} from "../model/closeableModules/subModules/dynoAutoMod/impl/ScamFilter";
import {ImageSpamFilter} from "../model/closeableModules/subModules/dynoAutoMod/impl/ImageSpamFilter";
import {LinkCooldownFilter} from "../model/closeableModules/subModules/dynoAutoMod/impl/LinkCooldownFilter";
import {SpoilersFilter} from "../model/closeableModules/subModules/dynoAutoMod/impl/SpoilersFilter";
import {FastMessageSpamFilter} from "../model/closeableModules/subModules/dynoAutoMod/impl/FastMessageSpamFilter";
import {EmojiSpamFilter} from "../model/closeableModules/subModules/dynoAutoMod/impl/EmojiSpamFilter";
import {MassMentionsFilter} from "../model/closeableModules/subModules/dynoAutoMod/impl/MassMentionsFilter";
import {DiscordInviteFilter} from "../model/closeableModules/subModules/dynoAutoMod/impl/DiscordInviteFilter";
import {AllCapsFilter} from "../model/closeableModules/subModules/dynoAutoMod/impl/AllCapsFilter";
import {BannedWordFilter} from "../model/closeableModules/subModules/dynoAutoMod/impl/BannedWordFilter";
import {AuditLogger} from "../events/closeableModules/logging/mod/AuditLogger";
import {DynoAutoMod} from "../managedEvents/messageEvents/closeableModules/DynoAutoMod";
import {RoleLogger} from "../events/closeableModules/logging/admin/RoleLogger";
import {MemberLogger} from "../events/closeableModules/logging/admin/MemberLogger";
import {MessageLogger} from "../events/closeableModules/logging/admin/MessageLogger";
import {ChannelLogger} from "../events/closeableModules/logging/admin/ChannelLogger";
import {AutoRole} from "../events/closeableModules/autoRole/AutoRole";
import {AutoResponder} from "../managedEvents/messageEvents/closeableModules/AutoResponder";

export namespace Beans {

    @registry([
        {token: SubModuleProxyDescriptor.token, useToken: ZalgoTextFilter},
        {token: SubModuleProxyDescriptor.token, useToken: ScamFilter},
        {token: SubModuleProxyDescriptor.token, useToken: ImageSpamFilter},
        {token: SubModuleProxyDescriptor.token, useToken: LinkCooldownFilter},
        {token: SubModuleProxyDescriptor.token, useToken: SpoilersFilter},
        {token: SubModuleProxyDescriptor.token, useToken: FastMessageSpamFilter},
        {token: SubModuleProxyDescriptor.token, useToken: EmojiSpamFilter},
        {token: SubModuleProxyDescriptor.token, useToken: MassMentionsFilter},
        {token: SubModuleProxyDescriptor.token, useToken: DiscordInviteFilter},
        {token: SubModuleProxyDescriptor.token, useToken: BannedWordFilter},
        {token: SubModuleProxyDescriptor.token, useToken: AllCapsFilter}
    ])
    export abstract class SubModuleProxyDescriptor {
        static readonly token = Symbol("ISubModule");
    }


    @registry([
        {token: CloseableModuleProxyDescriptor.token, useToken: AuditLogger},
        {token: CloseableModuleProxyDescriptor.token, useToken: DynoAutoMod},
        {token: CloseableModuleProxyDescriptor.token, useToken: AuditLogger},
        {token: CloseableModuleProxyDescriptor.token, useToken: RoleLogger},
        {token: CloseableModuleProxyDescriptor.token, useToken: MemberLogger},
        {token: CloseableModuleProxyDescriptor.token, useToken: ChannelLogger},
        {token: CloseableModuleProxyDescriptor.token, useToken: MessageLogger},
        {token: CloseableModuleProxyDescriptor.token, useToken: AutoRole},
        {token: CloseableModuleProxyDescriptor.token, useToken: AutoResponder}
    ])
    export abstract class CloseableModuleProxyDescriptor {
        static readonly token = Symbol("ICloseableModule");
    }
}

