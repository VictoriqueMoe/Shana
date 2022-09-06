import {container} from "tsyringe";

import {PropertyResolutionManager} from "../manager/PropertyResolutionManager.js";
import {Typeings} from "../../Typeings.js";
import {PropertyTYpe} from "../engine/IPropertyResolutionEngine.js";
import propTypes = Typeings.propTypes;

const manager = container.resolve(PropertyResolutionManager);
const propCache: Map<keyof propTypes, PropertyTYpe> = new Map();

/**
 * Get a property from the system. The location where the property is loaded from is agnostic and defined by the registered IPropertyResolutionEngine classes.
 * This will make the prop immutable, and can not be changed after set
 * This acts the similar to Spring's Value annotation
 */
export function Property(prop: keyof propTypes, required = true): PropertyDecorator {
    return (target, key): void => {
        const original = target[key];
        Reflect.deleteProperty(target, key);
        Reflect.defineProperty(target, key, {
            enumerable: true,
            get: () => {
                if (propCache.has(prop)) {
                    return propCache.get(prop);
                }
                let propValue = manager.getProperty(prop);
                if (required && propValue === null) {
                    throw new Error(`Unable to find prop with key "${prop}"`);
                }
                if (!required && propValue === null && original !== null && original !== undefined) {
                    // if not required and a default value is set
                    propValue = original;
                }
                propCache.set(prop, propValue);
                return propValue;
            }
        });
    };
}
