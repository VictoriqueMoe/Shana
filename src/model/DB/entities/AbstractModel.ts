import {Column, CreateDateColumn, UpdateDateColumn} from "typeorm";
import {RelationOptions} from "typeorm/decorator/options/RelationOptions";
import {IGuildAware} from "./IGuildAware";

export abstract class AbstractModel implements IGuildAware {

    protected static readonly joinCol = "guildId";

    protected static readonly cascadeOps: RelationOptions = {
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    };

    @Column({
        generated: "increment",
        primary: true
    })
    public id: number;

    @Column()
    public guildId: string;

    @CreateDateColumn()
    public createdAt: Date;

    @UpdateDateColumn()
    public updatedAt: Date;
}