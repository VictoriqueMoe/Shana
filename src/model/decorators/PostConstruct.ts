import {container} from "tsyringe";
import type InjectionToken from "tsyringe/dist/typings/providers/injection-token";

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

/**
 * Spring-like post construction executor that lazy loads this method after it is resolved
 * @param dependsOn
 * @constructor
 */
export function PostConstructDependsOn(dependsOn: InjectionToken<any>) {
    return function PostConstructDependsOn(target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
        container.afterResolution(
            dependsOn, () => {
                container.afterResolution(
                    target.constructor,
                    (_t, dependantResult) => {
                        descriptor.value.call(dependantResult);
                    },
                    {
                        frequency: "Once"
                    }
                );
            },
            {
                frequency: "Once"
            }
        );

    };
}