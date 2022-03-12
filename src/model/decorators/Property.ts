import {Typeings} from "../types/Typeings";
import {container} from "tsyringe";
import {PropertyResolutionFactory} from "../factory/PropertyResolutionFactory";
import {Property} from "../engine/IPropertyResolutionEngine";


const factory = container.resolve(PropertyResolutionFactory);
const engines = factory.engines;


/**
 * Get a property from the system. The location where the property is loaded from is agnostic and defined by the registered IPropertyResolutionEngine classes.
 * This acts the similar to Spring's Property annotation
 */
export function Property(prop: keyof Typeings.propTypes, required: boolean = true): PropertyDecorator {
    return (target, key): void => {
        const original = target[key];
        Reflect.deleteProperty(target, key);
        Reflect.defineProperty(target, key, {
            get: () => {
                let propValue: Property = null;
                for (const resolutionEngine of engines) {
                    const resolvedProp = resolutionEngine.getProperty(prop);
                    if (resolvedProp !== null) {
                        propValue = resolvedProp;
                        break;
                    }
                }
                if (required && propValue === null) {
                    throw new Error(`Unable to find prop with key "${prop}"`);
                }
                if (!required && propValue === null && original != null) {
                    return original;
                }
                return propValue ?? null;
            },
            enumerable: true,
            configurable: true
        });
    };
}
