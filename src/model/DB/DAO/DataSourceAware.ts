import {container} from "tsyringe";
import {DataSource} from "typeorm";

export abstract class DataSourceAware {
    public constructor() {
        DataSourceAware._ds = container.resolve(DataSource);
    }

    private static _ds: DataSource;

    public get ds(): DataSource {
        return DataSourceAware._ds;
    }
}
