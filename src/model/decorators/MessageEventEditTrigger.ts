import {ArgsOf, Client} from "@typeit/discord";

type EditType = ([message]: ArgsOf<"message">, client: Client, guardPayload: any, isUpdate: boolean) => Promise<void>;
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
    if (EditListenMethods.has(target)) {
        EditListenMethods.get(target).push(method);
    } else {
        EditListenMethods.set(target, [method]);
    }
};