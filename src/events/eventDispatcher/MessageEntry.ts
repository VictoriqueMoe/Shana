import {EditType, EventTriggerCondition} from "../../model/types/Typeings";
import {Message} from "discord.js";
import {Client} from "discordx";
import {ArrayUtils} from "../../utils/Utils";

export class MessageEntry {
    public constructor(private entryMethod: EditType, private triggerOnEdit: boolean, private conditions: EventTriggerCondition[] = []) {
    }

    public async trigger(message: Message, client: Client, context: any, isEdit: boolean = false): Promise<void> {
        if (isEdit && !this.triggerOnEdit) {
            return;
        }
        if (ArrayUtils.isValidArray(this.conditions)) {
            for (const condition of this.conditions) {
                if (!await condition(message)) {
                    return;
                }
            }
        }
        return this.entryMethod.call(context, [message], client, {}, isEdit);
    }
}