import {ArgsOf, Client} from "@typeit/discord";

export type EditType = ([message]: ArgsOf<"message">, client: Client, isUpdate: boolean) => Promise<void>;
export const EditListenMethods: Map<any, EditType[]> = new Map();

export const MessageEventEditTrigger = (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const method: EditType = target[propertyKey];
    if (EditListenMethods.has(target)) {
        EditListenMethods.get(target).push(method);
    } else {
        EditListenMethods.set(target, [method]);
    }
};