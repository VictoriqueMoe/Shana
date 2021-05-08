import {ArgsOf, Client, Guard, On} from "@typeit/discord";
import {NotBot} from "../../guards/NotABot";
import {EnabledGuard} from "../../guards/EnabledGuard";
import {ArrayUtils, ObjectUtil} from "../../utils/Utils";
import {CloseOptionModel} from "../../model/DB/autoMod/impl/CloseOption.model";
import {TriggerConstraint} from "../../model/closeableModules/impl/TriggerConstraint";
import {AutoResponderModel} from "../../model/DB/autoMod/impl/AutoResponder.model";
import {Message} from "discord.js";

export class AutoResponder extends TriggerConstraint {

    private static _uid = ObjectUtil.guid();

    constructor() {
        super(CloseOptionModel, AutoResponder._uid);
    }

    @On("message")
    @Guard(NotBot, EnabledGuard("AutoResponder"))
    private async process([message]: ArgsOf<"message">, client: Client): Promise<void> {
        const guildId = message.guild.id;
        const channel = message.channel;
        const allRespondObjects = await AutoResponderModel.findAll({
            where: {
                guildId
            }
        });
        const messageContent = message.content?.trim().toLowerCase();
        if (!ObjectUtil.validString(messageContent) || !ArrayUtils.isValidArray(allRespondObjects)) {
            return;
        }
        for (const autoResponder of allRespondObjects) {
            if (!super.canTrigger(autoResponder, message)) {
                continue;
            }
            const trigger = autoResponder.title;
            const {wildCard, useRegex} = autoResponder;
            let shouldTrigger = false;
            if (wildCard) {
                if (messageContent.includes(trigger.toLowerCase())) {
                    shouldTrigger = true;
                }
            } else if (useRegex) {
                const regex = new RegExp(trigger, 'giu');
                if (regex.test(messageContent)) {
                    shouldTrigger = true;
                }
            } else {
                if (messageContent === trigger.toLowerCase()) {
                    shouldTrigger = true;
                }
            }
            if (!shouldTrigger) {
                continue;
            }
            const {responseType} = autoResponder;
            switch (responseType) {
                case "message": {
                    const responseText: string = await this._parseVars(autoResponder.response, message);
                    channel.send(responseText);
                    break;
                }
                case "delete":
                    if (message.deletable) {
                        message.delete();
                    }
            }
        }
    }

    get isDynoReplacement(): boolean {
        return false;
    }

    get moduleId(): string {
        return "AutoResponder";
    }

    private async _parseVars(response: string, {channel, guild, member}: Message): Promise<string> {
        let retStr = String(response);
        const regex = new RegExp(/{([^{}]+)}/gm);
        let result;
        while ((result = regex.exec(response)) !== null) {
            for (let match of result) {
                if (!ObjectUtil.validString(match)) {
                    continue;
                }
                const prefix = match[0];
                if (prefix === "{") {
                    continue;
                }
                switch (prefix) {
                    case "@": {
                        // is inject user
                        if (!match.includes("#") || match.length <= 2) {
                            continue;
                        }
                        match = match.substring(1);
                        const member = guild.members.cache.find(v => v.user.tag == match);
                        if (!member) {
                            continue;
                        }
                        retStr = retStr.replace(`{@${match}}`, `<@${member.id}>`);
                        break;
                    }
                    case "&": {
                        // is inject role
                        match = match.substring(1);
                        const role = guild.roles.cache.find(r => r.name === match);
                        if (!role) {
                            continue;
                        }
                        retStr = retStr.replace(`{&${match}}`, `<@&${role.id}>`);
                        break;
                    }
                    case "#": {
                        // is inject channel
                        match = match.substring(1);
                        const channel = guild.channels.cache.find(c => c.name === match);
                        if (!channel) {
                            continue;
                        }
                        retStr = retStr.replace(`{#${match}}`, `<#${channel.id}>`);
                        break;
                    }
                    default:
                        if (match === "user") {
                            retStr = retStr.replace(`{${match}}`, `<@${member.id}>`);
                            // mention user with tag
                        } else if (match === "server") {
                            retStr = retStr.replace(`{${match}}`, `${guild.name}`);
                            // inject server name
                        } else if (match === "channel") {
                            retStr = retStr.replace(`{${match}}`, `<#${channel.id}>`);
                            // inject channel
                        } else {
                            retStr = retStr.replace(`{${match}}`, `${member.user.username}`);
                            // mention user without tag
                        }
                }
            }
        }
        return retStr;
    }
}