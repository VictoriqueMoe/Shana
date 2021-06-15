import {EditType, EventTriggerCondition} from "../types/Typeings";
import {MessageEventDispatcher} from "../../events/eventDispatcher/MessageEventDispatcher";
import {Message} from "discord.js";
import {MessageEntry} from "../../events/eventDispatcher/MessageEntry";

export async function notBot(message: Message): Promise<boolean> {
    return message.channel.type !== "dm" && !message.author.bot;
}

export function MessageListenerDecorator(triggerOnEdit = false, ...conditions: EventTriggerCondition[]) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
        console.log(`Adding: "${target.constructor.name}.${propertyKey}" to listeners for messages`);
        const constructor = target.constructor;
        const map = MessageEventDispatcher.messageListenerMap;

        const method: EditType = target[propertyKey];
        const entry = new MessageEntry(method, triggerOnEdit, conditions);
        let context = null;
        for (const [_context,] of map) {
            if (_context.constructor === constructor) {
                context = _context;
                break;
            }
        }
        if (context) {
            map.get(context).push(entry);
        } else {
            context = new constructor();
            map.set(context, [entry]);
        }
    };
}