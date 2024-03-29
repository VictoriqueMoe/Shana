import {Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {RelationOptions} from "typeorm/decorator/options/RelationOptions.js";
import {IGuildAware} from "./IGuildAware.js";

export abstract class AbstractModel implements IGuildAware {

    protected static readonly joinCol = "guildId";

    protected static readonly cascadeOps: RelationOptions = {
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    };

    @PrimaryGeneratedColumn("increment")
    public id: number;

    @Column()
    public guildId: string;

    @CreateDateColumn()
    public createdAt: Date;

    @UpdateDateColumn()
    public updatedAt: Date;
}
