import {Model} from "sequelize-typescript";
import {SaveOptions} from "sequelize/types/lib/model";
import {UniqueConstraintError, ValidationError} from "sequelize";
import {ObjectUtil} from "../utils/Utils";
import {TextChannel} from "discord.js";
import {Channels} from "../enums/Channels";
import {Main} from "../Main";

export abstract class BaseDAO<T extends Model> {

    /*protected async saveOrUpdate(model: T): Promise<T> {
        let b = model.get();
        // @ts-ignore
        let staticCLass: typeof ModelStatic = model.constructor as typeof ModelStatic;
        try {
            return await this.commitToDatabase(model);
        } catch (e) {
            if (e instanceof UniqueViolationError) {
                // @ts-ignore
                let persistenceObject: T = await staticCLass.findOne({where: {id: model.id}}) as T;
                return staticCLass.update(
                    b,
                    {
                        where: {
                            id: model.id
                        }
                    }
                )[1] as T;
            }
        }
    }*/

    protected async commitToDatabase(model: T, options?: SaveOptions, silentOnDupe = false): Promise<T> {
        const channel: TextChannel = Main.client.channels.cache.get(Channels.TEST_CHANNEL) as TextChannel;
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
                if(!silentOnDupe){
                    channel.send(`Entry already exists in database`);
                    console.log(`Entry already exists in database: ${model}`);
                }
                throw e;
            }
        } finally {
            if (model == null || ObjectUtil.validString(errorStr)) {
                channel.send(`An error occurred: ${errorStr}`);
            }
        }
    }
}

export class UniqueViolationError extends Error {
    constructor(message?: string) {
        super(message);
    }
}