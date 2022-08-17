export class CronException extends Error {
    constructor(e: string) {
        super(e);

        Object.setPrototypeOf(this, CronException.prototype);
    }
}
