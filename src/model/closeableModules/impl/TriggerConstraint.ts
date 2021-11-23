import {CloseableModule} from "./CloseableModule.js";
import {ITriggerConstraint} from "../ITriggerConstraint.js";
import {IEventSecurityConstraint} from "../../DB/IEventSecurityConstraint.js";
import {GuildChannel, Message} from "discord.js";
import {ArrayUtils} from "../../../utils/Utils.js";
import {ModuleSettings} from "../ModuleSettings.js";

export abstract class TriggerConstraint<T extends ModuleSettings> extends CloseableModule<T> implements ITriggerConstraint {

    public abstract override get moduleId(): string;

    canTrigger(obj: IEventSecurityConstraint, message: Message): boolean {
        const member = message.member;
        if (!member) {
            return false;
        }
        const roleIds = [...member.roles.cache.keys()];
        const channel = message.channel;
        if (!(channel instanceof GuildChannel)) {
            return false;
        }
        const channelId = channel.id;
        const parentChannelId = channel.parentId;
        const {allowedChannels, allowedRoles, ignoredChannels, ignoredRoles} = obj;

        if (ArrayUtils.isValidArray(allowedChannels)) {
            if (!allowedChannels.some(chId => chId.id === channelId || chId.id === parentChannelId)) {
                return false;
            }
        } else if (ArrayUtils.isValidArray(ignoredChannels)) {
            if (ignoredChannels.some(chId => chId.id === channelId || chId.id === parentChannelId)) {
                return false;
            }
        }

        if (ArrayUtils.isValidArray(allowedRoles)) {
            if (!allowedRoles.some(role => roleIds.includes(role.id))) {
                return false;
            }
        } else if (ArrayUtils.isValidArray(ignoredRoles)) {
            if (ignoredRoles.some(role => roleIds.includes(role.id))) {
                return false;
            }
        }

        return true;
    }

}