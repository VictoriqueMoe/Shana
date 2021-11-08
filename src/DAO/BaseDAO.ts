import {ObjectUtil} from "../utils/Utils";
import {EntityManager, QueryFailedError, Repository} from "typeorm";
import {InsertResult} from "typeorm/query-builder/result/InsertResult";
import {EntityTarget} from "typeorm/common/EntityTarget";

export abstract class BaseDAO<T> {

    protected async commitToDatabase(repo: Repository<T> | EntityManager, model: T[], modelClass?: EntityTarget<T>, opts: {
        silentOnDupe?: boolean,
        saveOrUpdate?: boolean
    } = {}): Promise<InsertResult | T[]> {
        let errorStr = "";
        try {
            try {
                if (repo instanceof EntityManager) {
                    if (!modelClass) {
                        throw new Error("Must supply class");
                    }
                    return opts?.saveOrUpdate ? repo.save(modelClass, model) : repo.insert(modelClass, model);
                } else {
                    return opts?.saveOrUpdate ? repo.save(model) : repo.insert(model);
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
    }
}

export class UniqueViolationError extends Error {
    constructor(message?: string) {
        super(message);
    }
}