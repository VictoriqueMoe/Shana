import {Model} from "sequelize-typescript";
import {SaveOptions} from "sequelize/types/lib/model";
import {UniqueConstraintError, ValidationError} from "sequelize";
import {ObjectUtil} from "../utils/Utils";

export abstract class BaseDAO<T extends Model> {

    protected async commitToDatabase(model: T, options?: SaveOptions, silentOnDupe: boolean = false): Promise<T> {
        let errorStr = "";
        // hacky 'mc hack
        try {
            try {
                return await model.save(options);
            } catch (e) {
                if (e instanceof UniqueConstraintError) {
                    throw new UniqueViolationError(e.message);
                } else if (e instanceof ValidationError) {
                    const errors = e.errors;
                    let isOnlyUniqueError = true;
                    for (const error of errors) {
                        if (error.type !== "unique violation") {
                            isOnlyUniqueError = false;
                        }
                    }
                    if (isOnlyUniqueError) {
                        throw new UniqueViolationError(e.message);
                    }
                    errorStr = errors.map(error => `${error.message}`).join("\n");
                } else {
                    throw e;
                }
            }
        } catch (e) {
            if (e instanceof UniqueViolationError) {
                if (!silentOnDupe) {
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