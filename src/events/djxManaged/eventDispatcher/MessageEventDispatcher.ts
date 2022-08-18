import type {ArgsOf} from "discordx";
import {Client, Discord, On} from "discordx";
import {Message} from "discord.js";
import {container, injectable} from "tsyringe";
import type constructor from "tsyringe/dist/typings/types/constructor";
import {Typeings} from "../../../model/Typeings.js";
import {ObjectUtil} from "../../../utils/Utils.js";
import {AbstractFactory} from "../../../model/framework/factory/AbstractFactory.js";
import EditType = Typeings.EditType;
import EventTriggerCondition = Typeings.EventTriggerCondition;

@Discord()
@injectable()
export class MessageEventDispatcher {

    private static readonly _messageListenerMap: Map<constructor<unknown>, MessageEntry[]> = new Map();

    public static get messageListenerMap(): Map<constructor<unknown>, MessageEntry[]> {
        return MessageEventDispatcher._messageListenerMap;
    }

    @On({
        event: "messageCreate"
    })
    private async eventTrigger([message]: ArgsOf<"messageCreate">, client: Client): Promise<void> {
        await client.executeCommand(message, {
            caseSensitive: false
        });
        return this.trigger(message, client, false);
    }


    @On({
        event: "messageUpdate"
    })
    private async messageUpdater([, newMessage]: ArgsOf<"messageUpdate">, client: Client): Promise<void> {
        if (newMessage.author.bot) {
            return;
        }
        if (!(newMessage instanceof Message)) {
            try {
                newMessage = await newMessage.fetch();
            } catch {
                return;
            }
        }
        return this.trigger(newMessage, client, true);
    }

    private trigger(message: Message, client: Client, isEdit = false): Promise<void> {
        const retArr: Promise<void>[] = [];
        for (const [context, entries] of MessageEventDispatcher._messageListenerMap) {
            const contextInstance = this.getContextInstance(context);
            for (const entry of entries) {
                retArr.push(entry.trigger(message, client, contextInstance, isEdit));
            }
        }
        return Promise.all(retArr).then();
    }

    private getContextInstance(context: constructor<unknown>): unknown {
        for (const factory of AbstractFactory.factories) {
            for (const engine of factory.engines) {
                if (engine.constructor === context) {
                    return engine;
                }
            }
        }
        return container.resolve(context);
    }
}

export class MessageEntry {
    public constructor(private entryMethod: EditType, private triggerOnEdit: boolean, private conditions: EventTriggerCondition[] = []) {
    }

    public async trigger(message: Message, client: Client, context: unknown, isEdit = false): Promise<void> {
        if (isEdit && !this.triggerOnEdit) {
            return;
        }
        if (ObjectUtil.isValidArray(this.conditions)) {
            for (const condition of this.conditions) {
                if (!await condition(message)) {
                    return;
                }
            }
        }
        return this.entryMethod.call(context, [message], client, {}, isEdit);
    }
}
