export class CronException extends Error {
    public constructor(e: string) {
        super(e);

        Object.setPrototypeOf(this, CronException.prototype);
    }
}
