import Timeout = NodeJS.Timeout;

export class CooldownArray {

    private _map: Map<string, Timeout>;

    constructor(private _timeOut: number) {
        if (Number.isNaN(_timeOut)) {
            throw new Error("Please supply a number");
        }
        this._map = new Map();
    }

    public push(userId: string): void {
        this._map.set(userId, setTimeout(() => {
            this._map.delete(userId);
        }, this._timeOut));
    }

    public refreshUser(userId: string): boolean {
        if (!this._map.has(userId)) {
            return false;
        }
        const timeoutFunction = this._map.get(userId);
        clearTimeout(timeoutFunction);
        this.push(userId);
        return true;
    }

    public isUserInCooldown(userId: string): boolean {
        return this._map.has(userId);
    }
}