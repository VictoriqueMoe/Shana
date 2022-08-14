import {CloseableModule} from "./CloseableModule.js";
import type {ITriggerConstraint} from "../ITriggerConstraint.js";
import type {IEventSecurityConstraint} from "../../DB/entities/IEventSecurityConstraint.js";
import {GuildChannel, Message} from "discord.js";
import type {ModuleSettings} from "../ModuleSettings.js";
import {ObjectUtil} from "../../../utils/Utils.js";

export abstract class TriggerConstraint<T extends ModuleSettings> extends CloseableModule<T> implements ITriggerConstraint {

    public abstract override get moduleId(): string;

    public canTrigger(obj: IEventSecurityConstraint, message: Message): boolean {
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

        if (ObjectUtil.isValidArray(allowedChannels)) {
            if (!allowedChannels.some(chId => chId.id === channelId || chId.id === parentChannelId)) {
                return false;
            }
        } else if (ObjectUtil.isValidArray(ignoredChannels)) {
            if (ignoredChannels.some(chId => chId.id === channelId || chId.id === parentChannelId)) {
                return false;
            }
        }

        if (ObjectUtil.isValidArray(allowedRoles)) {
            if (!allowedRoles.some(role => roleIds.includes(role.id))) {
                return false;
            }
        } else if (ObjectUtil.isValidArray(ignoredRoles)) {
            if (ignoredRoles.some(role => roleIds.includes(role.id))) {
                return false;
            }
        }

        return true;
    }

}
