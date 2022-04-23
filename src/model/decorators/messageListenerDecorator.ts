import type {EditType, EventTriggerCondition} from "../types/Typeings";
import {MessageEventDispatcher} from "../../events/eventDispatcher/MessageEventDispatcher";
import {MessageEntry} from "../../events/eventDispatcher/MessageEntry";
import type constructor from "tsyringe/dist/typings/types/constructor";

/**
 * signals this method to be triggered on a message event.
 * @param triggerOnEdit
 * @param conditions
 * @constructor
 */
export function MessageListenerDecorator(triggerOnEdit: boolean = false, ...conditions: EventTriggerCondition[]) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
        console.log(`Adding: "${target.constructor.name}.${propertyKey}" to listeners for messages`);
        const constructor = target.constructor;
        const map = MessageEventDispatcher.messageListenerMap;

        const method: EditType = target[propertyKey];
        const entry = new MessageEntry(method, triggerOnEdit, conditions);
        let context: constructor<any> = null;
        for (const [_context,] of map) {
            if (_context === constructor) {
                context = _context;
                break;
            }
        }
        context ? map.get(context).push(entry) : map.set(constructor, [entry]);
    };
}