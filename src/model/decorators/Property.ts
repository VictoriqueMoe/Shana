import {Typeings} from "../types/Typeings";
import {ObjectUtil} from "../../utils/Utils";

export function Property(prop: keyof Typeings.envTypes, opts?: { required?: boolean }): PropertyDecorator {
    return (target, key): void => {
        const original = target[key];
        Reflect.deleteProperty(target, key);
        Reflect.defineProperty(target, key, {
            get: () => {
                const propValue = process.env[prop];
                if (ObjectUtil.isValidObject(opts)) {
                    const {required} = opts;
                    if (required && !ObjectUtil.validString(propValue)) {
                        throw new Error(`Unable to find prop with key "${prop}" in .env file`);
                    }
                    if (original != null) {
                        return original;
                    }
                }
                return propValue ?? null;
            },
            enumerable: true,
            configurable: true
        });
    };
}
