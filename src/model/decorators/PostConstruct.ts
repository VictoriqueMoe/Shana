import {container} from "tsyringe";

export function PostConstruct(target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
    container.afterResolution(
        target.constructor,
        (_t, result, resolutionType) => {
            descriptor.value.call(result);
        },
        {
            frequency: "Once"
        }
    );
}