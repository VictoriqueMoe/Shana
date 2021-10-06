import Timeout = NodeJS.Timeout;
import * as Immutable from 'immutable';
import {ITimedSet} from "../ITimedSet";

/**
 * This set will evict items from the array after the set timout.
 * This set can only contain unique items, items are unique when === is true
 */
export class TimedSet<T> implements ITimedSet<T> {

    private _map: Map<T, Timeout>;

    /**
     * @param _timeOut - timeout in milliseconds
     */
    constructor(private _timeOut: number) {
        if (Number.isNaN(_timeOut)) {
            throw new Error("Please supply a number");
        }
        this._map = new Map();
    }

    public get size(): number {
        return this._map.size;
    }

    /**
     * GFet the raw underlying set backing this times array.
     * NOTE; this set is Immutable
     */
    public get rawSet(): Immutable.Set<T> {
        return Immutable.Set.of(...this._map.keys());
    }

    public get [Symbol.toStringTag](): string {
        return "Set";
    }

    public isEmpty(): boolean {
        return this._map.size === 0;
    }

    public add(key: T): this {
        this._map.set(key, setTimeout(() => {
            this._map.delete(key);
        }, this._timeOut));
        return this;
    }

    public has(value: T): boolean {
        return this._map.has(value);
    }

    public delete(key: T): boolean {
        if (!this._map.has(key)) {
            return false;
        }
        const timeoutFunction = this._map.get(key);
        clearTimeout(timeoutFunction);
        return this._map.delete(key);
    }

    public refresh(key: T): boolean {
        if (!this._map.has(key)) {
            return false;
        }
        const timeoutFunction = this._map.get(key);
        clearTimeout(timeoutFunction);
        this.add(key);
        return true;
    }

    public clear(): void {
        for (const [, value] of this._map) {
            clearTimeout(value);
        }
        this._map = new Map();
    }

    public [Symbol.iterator](): IterableIterator<T> {
        let counter = -1;
        return {
            [Symbol.iterator](): IterableIterator<T> {
                return this[Symbol.iterator];
                // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
            }, next: () => {
                counter++;
                return {
                    done: counter === this.size,
                    value: [...this._map.keys()][counter]
                };
            }
        };
    }

    public entries(): IterableIterator<[T, T]> {
        return new Set([...this._map.keys()]).entries();
    }

    public forEach(callbackfn: (value: T, value2: T, set: Set<T>) => void, thisArg?: any): void {
        this._map.forEach((value, key, map) => callbackfn.call(thisArg ? thisArg : this, key, key, this));
    }

    public keys(): IterableIterator<T> {
        return this._map.keys();
    }

    public values(): IterableIterator<T> {
        return this._map.keys();
    }
}