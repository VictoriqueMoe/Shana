import {IDiFactory} from "./IDiFactory";
import Immutable from "immutable";

export abstract class AbstractFactory<T> implements IDiFactory<T> {

    private readonly _engines: Immutable.Set<T>;

    public static factories: AbstractFactory<unknown>[] = [];

    public constructor() {
        this._engines = this.populateEngines();
        AbstractFactory.factories.push(this);
    }

    get engines(): Immutable.Set<T> {
        return Immutable.Set(this._engines);
    }

    protected abstract populateEngines(): Immutable.Set<T>;
}
