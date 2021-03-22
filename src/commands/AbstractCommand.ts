import {Typeings} from "../model/types/Typeings";
import {BaseDAO} from "../DAO/BaseDAO";
import {Model} from "sequelize-typescript";
import CommandArgs = Typeings.CommandArgs;
import Command = Typeings.Command;

export abstract class AbstractCommand<T extends Model> extends BaseDAO<T> {
    protected constructor(private _commands: CommandArgs) {
        super();
    }

    public get commandDescriptors(): CommandArgs {
        return this._commands;
    }

    public getCommand(name: string): Command {
        for (const command of this._commands.commands) {
            if (command.name === name) {
                return command;
            }
        }
        return null;
    }

}