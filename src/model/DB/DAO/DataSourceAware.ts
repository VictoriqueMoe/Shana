import {container} from "tsyringe";
import {DataSource} from "typeorm";

export abstract class DataSourceAware {
    protected _ds: DataSource;

    protected constructor() {
        this._ds = container.resolve(DataSource);
    }
}
