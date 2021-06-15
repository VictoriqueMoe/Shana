import {DIService} from "@typeit/discord";
import {EditType} from "../types/Typeings";


export const EditListenMethods: Map<any, EditType[]> = new Map();

/**
 * This annotation will allow any message listener to be recalled when a message is edited
 * @param target
 * @param propertyKey
 * @param descriptor
 * @constructor
 */
export const MessageEventEditTrigger = (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    console.log(`Adding: "${target.constructor.name}.${propertyKey}" to listeners for message editing`);
    const method: EditType = target[propertyKey];
    const context: any = DIService.instance.getService(target.constructor);
    if (!context) {
        throw new Error(`No context for: "${target.constructor.name}"`);
    }
    if (EditListenMethods.has(context)) {
        EditListenMethods.get(context).push(method);
    } else {
        EditListenMethods.set(context, [method]);
    }
};
