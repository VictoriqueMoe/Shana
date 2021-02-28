import Timeout = NodeJS.Timeout;
import * as Immutable from 'immutable';

export class TimedArray<T> {

    private _map: Map<T, Timeout>;

    constructor(private _timeOut: number) {
        if (Number.isNaN(_timeOut)) {
            throw new Error("Please supply a number");
        }
        this._map = new Map();
    }

    public push(key: T): void {
        this._map.set(key, setTimeout(() => {
            this._map.delete(key);
        }, this._timeOut));
    }

    public remove(key: T): boolean {
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
        this.push(key);
        return true;
    }

    public clear(): void {
        for (const [, value] of this._map) {
            clearTimeout(value);
        }
        this._map = new Map();
    }

    public isInArray(key: T): boolean {
        return this._map.has(key);
    }

    /**
     * GFet the raw underlying set backing this times array.
     * NOTE; this set is Immutable
     */
    public get rawSet(): Immutable.Set<T> {
        return Immutable.Set.of(...this._map.keys());
    }
}