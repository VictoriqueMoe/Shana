import {Table, Column, Model, Unique, DataType, Default, AllowNull} from 'sequelize-typescript';

@Table
export class TagModel extends Model{

    @Column({unique: true})
    private _name: string;

    @Column(DataType.TEXT)
    private _description:string;

    @Column
    private _username:string;

    @AllowNull(false)
    @Default(0)
    @Column(DataType.INTEGER)
    private _usage_count:number;

    public get name(): string {
        return this._name;
    }

    public get description(): string {
        return this._description;
    }

    public get username(): string {
        return this._username;
    }

    public get usage_count(): number {
        return this._usage_count;
    }
}