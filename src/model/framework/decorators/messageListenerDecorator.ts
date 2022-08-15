import type constructor from "tsyringe/dist/typings/types/constructor";
import {Typeings} from "../../Typeings.js";
import {
    MessageEntry,
    MessageEventDispatcher
} from "../../../events/djxManaged/eventDispatcher/MessageEventDispatcher.js";
import logger from "../../../utils/LoggerFactory.js";
import EditType = Typeings.EditType;
import EventTriggerCondition = Typeings.EventTriggerCondition;

/**
 * signals this method to be triggered on a message event.
 * @param triggerOnEdit
 * @param conditions
 * @constructor
 */
export function MessageListenerDecorator(triggerOnEdit = false, conditions: EventTriggerCondition[]) {
    return function (target: any, propertyKey: string): void {
        logger.info(`Adding: "${target.constructor.name}.${propertyKey}" to listeners for messages`);
        const targetConstructor = target.constructor;
        const map = MessageEventDispatcher.messageListenerMap;

        const method: EditType = target[propertyKey];
        const entry = new MessageEntry(method, triggerOnEdit, conditions);
        let context: constructor<unknown> = null;
        for (const [_context,] of map) {
            if (_context === targetConstructor) {
                context = _context;
                break;
            }
        }
        context ? map.get(context).push(entry) : map.set(targetConstructor, [entry]);
    };
}
