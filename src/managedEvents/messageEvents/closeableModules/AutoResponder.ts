import {ArgsOf, Client} from "discordx";
import {ArrayUtils, DiscordUtils, ObjectUtil} from "../../../utils/Utils";
import {CloseOptionModel} from "../../../model/DB/autoMod/impl/CloseOption.model";
import {TriggerConstraint} from "../../../model/closeableModules/impl/TriggerConstraint";
import {Message} from "discord.js";
import {MessageListenerDecorator} from "../../../model/decorators/messageListenerDecorator";
import {AutoResponderManager} from "../../../model/guild/manager/AutoResponderManager";
import {notBot} from "../../../guards/NotABot";
import {singleton} from "tsyringe";
import {AutoResponderModel} from "../../../model/DB/autoMod/impl/AutoResponder.model";
import {createWorker, Worker} from "tesseract.js";
import path from 'path';
import isImageFast from 'is-image-fast';

@singleton()
export class AutoResponder extends TriggerConstraint<null> {

    constructor(private _autoResponderManager: AutoResponderManager) {
        super(CloseOptionModel);
    }

    get moduleId(): string {
        return "AutoResponder";
    }

    @MessageListenerDecorator(true, notBot)
    private async process([message]: ArgsOf<"messageCreate">, client: Client, guardPayload: any, isUpdate: boolean = false): Promise<void> {
        const channel = message.channel;
        const guildId = message.guild.id;
        if (!await this.canRun(guildId, null, channel)) {
            return;
        }

        const allRespondObjects = await this._autoResponderManager.getAllAutoResponders(guildId);
        const messageContent = message.content?.trim().toLowerCase();
        if (!ArrayUtils.isValidArray(allRespondObjects)) {
            return;
        }
        for (const autoResponder of allRespondObjects) {
            if (!autoResponder.useOCR && !ObjectUtil.validString(messageContent)) {
                continue;
            }
            if (!super.canTrigger(autoResponder, message)) {
                continue;
            }
            let shouldTrigger = false;
            if (autoResponder.useOCR) {
                const imageUrls = await DiscordUtils.getImageUrlsFromMessageOrReference(message, {
                    ref: true
                });
                if (imageUrls.size > 0) {
                    let worker: Worker = null;
                    try {
                        worker = createWorker({
                            cachePath: `${__dirname}/../../../../trainData`
                        });
                        await worker.load();
                        await worker.loadLanguage('eng');
                        await worker.initialize('eng');
                        for (const url of imageUrls) {
                            const isImage: boolean = await isImageFast(url);
                            if (!isImage) {
                                continue;
                            }
                            const image = await DiscordUtils.loadResourceFromURL(url);
                            // if larger or equal to 2mb, ignore it
                            if (Buffer.byteLength(image) >= 1048576) {
                                continue;
                            }
                            const fileType = path.extname(url).split('.').pop();
                            if (fileType === "bmp" ||
                                fileType === "jpg" ||
                                fileType === "png") {
                                const {data: {text}} = await worker.recognize(image);
                                console.log(`Image text recognised as: ${text}`);
                                shouldTrigger = this.shouldExecuteResponder(autoResponder, text);
                                if (shouldTrigger) {
                                    break;
                                }
                            }
                        }
                        if (!shouldTrigger) {
                            continue;
                        }
                    } finally {
                        if (worker) {
                            await worker.terminate();
                        }
                    }
                }
            }
            if (!shouldTrigger) {
                if (!this.shouldExecuteResponder(autoResponder, messageContent)) {
                    continue;
                }
            }

            const {responseType} = autoResponder;
            switch (responseType) {
                case "message": {
                    const responseText: string = this._parseVars(autoResponder.response, message);
                    if (autoResponder.publicDelete) {
                        message.delete();
                    }
                    if (isUpdate) {
                        message.reply(responseText);
                    } else {
                        channel.send(responseText);
                    }
                    break;
                }
                case "delete":
                    if (message.deletable) {
                        try {
                            message.delete();
                        } catch {

                        }
                    }
                    break;
                case "reaction": {
                    const emojis = autoResponder.emojiReactions;
                    for (const emoji of emojis) {
                        try {
                            await message.react(emoji);
                        } catch (e) {
                            console.warn(e);
                        }
                    }
                    break;
                }
                case "kick": {
                    const toDm = autoResponder.response;
                    let {member} = message;
                    if (!member.kickable) {
                        continue;
                    }
                    let kickMessage: Message = null;
                    let kickReason = "";
                    if (ObjectUtil.validString(toDm)) {
                        try {
                            kickMessage = await member.send(toDm);
                        } catch {
                            kickReason = ", however, I could not DM this member";
                        }
                    }
                    try {
                        member = await member.kick(`Kicked via auto responder rule: "${autoResponder.title}"${kickReason}`);
                    } catch {
                        if (kickMessage) {
                            await kickMessage.delete();
                        }
                    }
                    if (autoResponder.publicDelete && !message.deleted) {
                        message.delete();
                    }
                }
            }
        }
    }

    private shouldExecuteResponder(autoResponder: AutoResponderModel, messageContent: string): boolean {
        const {wildCard, useRegex} = autoResponder;
        let shouldTrigger = false;
        if (wildCard) {
            if (messageContent.toLowerCase().includes(autoResponder.title.toLowerCase())) {
                shouldTrigger = true;
            }
        } else if (useRegex) {
            const newContent = messageContent.replace(/[*_]/gi, "");
            const regex = new RegExp(autoResponder.title, 'gium');
            if (regex.test(newContent)) {
                shouldTrigger = true;
            }
        } else {
            if (messageContent === autoResponder.title.toLowerCase()) {
                shouldTrigger = true;
            }
        }
        return shouldTrigger;
    }

    private _parseVars(response: string, {channel, guild, member}: Message): string {
        let retStr = String(response);
        const regex = new RegExp(/{([^{}]+)}/gm);
        let result: RegExpExecArray;
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
                        switch (match) {
                            case "user":
                                retStr = retStr.replace(`{${match}}`, `<@${member.id}>`);
                                // mention user with tag
                                break;
                            case "server":
                                retStr = retStr.replace(`{${match}}`, `${guild.name}`);
                                // inject server name
                                break;
                            case "channel":
                                retStr = retStr.replace(`{${match}}`, `<#${channel.id}>`);
                                // inject channel
                                break;
                            default:
                                retStr = retStr.replace(`{${match}}`, `${member.user.username}`);
                                break;
                        }
                }
            }
        }
        return retStr;
    }
}