import {Client} from "@typeit/discord";

const {token} = require('../config.json');

export class Main {
    private static _client: Client;

    static get client(): Client {
        return this._client;
    }

    public static start(): void {
        this._client = new Client();

        this._client.login(
            token,
            `${__dirname}/discord/*.ts`,
            `${__dirname}/discord/*.js`,
        );
    }
}

Main.start();