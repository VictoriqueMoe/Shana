import {Model} from "sequelize-typescript";
import {SaveOptions} from "sequelize/types/lib/model";
import {CommandMessage} from "@typeit/discord";
import {UniqueConstraintError, ValidationError} from "sequelize";
import {ObjectUtil} from "../utils/Utils";

export abstract class BaseDAO<T extends Model> {

    protected commitToDatabase(model: T, command: CommandMessage, options?: SaveOptions): Promise<T> {
        let errorStr = "";
        return model.save(options).catch((validationError: ValidationError) => {
            let errors = validationError.errors;
            //TODO parse constraint errors, resulting error is shitty
            errorStr = errors.map(error => `${error.message}`).join("\n");
        }).catch((uniqueConstraintError: UniqueConstraintError) => {
            //TODO do this when i actually know what it means
            console.dir(`ERROR: ${uniqueConstraintError}`);
        }).catch(err => {
            // catch all other errors
        }).then(model => {
            if (model == null || ObjectUtil.validString(errorStr)) {
                command.reply(`An error occurred: ${errorStr}`);
                throw errorStr;
            }
            return model as T;
        });
    }
}