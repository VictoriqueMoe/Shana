export class WeebGFSession {

    constructor(private _guildId: string, private _cs: string) {
    }

    public get guildId(): string {
        return this._guildId;
    }

    public get cs(): string {
        return this._cs;
    }
}