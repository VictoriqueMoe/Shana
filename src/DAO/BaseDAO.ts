import {ObjectUtil} from "../utils/Utils";
import {EntityManager, getManager, QueryFailedError, Repository} from "typeorm";
import {EntityTarget} from "typeorm/common/EntityTarget";

export abstract class BaseDAO<T> {

    /**
     * Build an entity by injecting props as an object
     * @param instance
     * @param data
     */
    public static build<T extends new (...args: any) => any>(instance: T, data: Record<string, any>): InstanceType<T> {
        return getManager().create(instance, data);
    }

    protected async commitToDatabase(repo: Repository<T> | EntityManager, model: T[], modelClass?: EntityTarget<T>, opts: {
        silentOnDupe?: boolean
    } = {}): Promise<T[]> {
        let errorStr = "";
        let result: T[];
        try {
            try {
                if (repo instanceof EntityManager) {
                    if (!modelClass) {
                        throw new Error("Must supply class");
                    }
                    result = await repo.save(modelClass, model);
                } else {
                    result = await repo.save(model);
                }
            } catch (e) {
                if (e instanceof QueryFailedError) {
                    const error = e.message;
                    if (error.includes("UNIQUE constraint failed")) {
                        throw new UniqueViolationError(e.message);
                    }
                    errorStr = error;
                } else {
                    throw e;
                }
            }
        } catch (e) {
            if (e instanceof UniqueViolationError) {
                if (!opts?.silentOnDupe) {
                    console.log(`Entry already exists in database: ${model}`);
                }
                throw e;
            }
        } finally {
            if (model == null || ObjectUtil.validString(errorStr)) {
                console.error(`An error occurred: ${errorStr}`);
            }
        }
        return result;
    }
}

export class UniqueViolationError extends Error {
    constructor(message?: string) {
        super(message);
    }
}
