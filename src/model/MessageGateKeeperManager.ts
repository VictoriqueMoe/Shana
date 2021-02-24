import {IMessageGateKeeperFilter} from "../modules/automod/IMessageGateKeeperFilter";
import * as Immutable from 'immutable';

export class MessageGateKeeperManager {
    private static _instance: MessageGateKeeperManager;
    private readonly _filters: Set<IMessageGateKeeperFilter>;

    private constructor() {
        this._filters = new Set();
    }

    public static get instance(): MessageGateKeeperManager {
        if (!MessageGateKeeperManager._instance) {
            MessageGateKeeperManager._instance = new MessageGateKeeperManager();
        }
        return MessageGateKeeperManager._instance;
    }

    public addFilter(filter: IMessageGateKeeperFilter): void {
        this._filters.add(filter);
    }

    public get filters(): Immutable.Set<IMessageGateKeeperFilter> {
        return Immutable.Set.of(...this._filters.values());
    }
}