export class ChronException extends Error{
    constructor(e:string) {
        super(e);

        Object.setPrototypeOf(this, ChronException.prototype);
    }
}