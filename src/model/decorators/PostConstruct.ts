import {container} from "tsyringe";

/**
 * Spring-like post construction executor, this will fire after a dependency is resolved and constructed
 * @param target
 * @param propertyKey
 * @param descriptor
 * @constructor
 */
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