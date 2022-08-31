import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {IIdentifiable} from "./IIdentifiable.js";

@Entity()
export class VicImageTokenModel implements IIdentifiable {
    @PrimaryGeneratedColumn("increment")
    public id: number;

    @CreateDateColumn()
    public createdAt: Date;

    @UpdateDateColumn()
    public updatedAt: Date;

    @Column({
        unique: true,
        nullable: false,
    })
    public userId: string;


}
