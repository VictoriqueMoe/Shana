import {ArgsOf, Client, Guard, On} from "@typeit/discord";
import {NotBot} from "../../guards/NotABot";
import {EnabledGuard} from "../../guards/EnabledGuard";
import {ArrayUtils, ObjectUtil} from "../../utils/Utils";
import {CloseOptionModel} from "../../model/DB/autoMod/impl/CloseOption.model";
import {TriggerConstraint} from "../../model/closeableModules/impl/TriggerConstraint";
import {AutoResponderModel} from "../../model/DB/autoMod/impl/AutoResponder.model";

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
                case "message":
                    channel.send(autoResponder.response);
                    break;
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

}