import {Model} from "sequelize-typescript";
import {SaveOptions} from "sequelize/types/lib/model";
import {UniqueConstraintError, ValidationError} from "sequelize";
import {ObjectUtil} from "../utils/Utils";
import {TextChannel} from "discord.js";
import {Channels} from "../enums/Channels";
import {Main} from "../Main";

export abstract class BaseDAO<T extends Model> {

    protected commitToDatabase(model: T, options?: SaveOptions): Promise<T> {
        let channel: TextChannel = Main.client.channels.cache.get(Channels.TEST_CHANNEL) as TextChannel;
        let errorStr = "";
        return model.save(options).catch((validationError: ValidationError) => {
            let errors = validationError.errors;
            let isOnlyUniqueError = true;
            for(let error of errors){
                if(error.type !== "unique violation"){
                    isOnlyUniqueError = false;
                }
            }
            if(isOnlyUniqueError){
                errorStr = "User is already in the database";
                return;
            }
            //TODO parse constraint errors, resulting error is shitty
            errorStr = errors.map(error => `${error.message}`).join("\n");
        }).catch((uniqueConstraintError: UniqueConstraintError) => {
            //TODO do this when i actually know what it means
            console.dir(`ERROR: ${uniqueConstraintError}`);
        }).catch(err => {
            // catch all other errors
        }).then(model => {
            if (model == null || ObjectUtil.validString(errorStr)) {
                channel.send(`An error occurred: ${errorStr}`);
                throw errorStr;
            }
            return model as T;
        });
    }
}