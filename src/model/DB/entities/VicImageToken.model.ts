import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";

@Entity()
export class VicImageTokenModel {
    @PrimaryGeneratedColumn("increment")
    public id: number;

    @CreateDateColumn()
    public createdAt: Date;

    @UpdateDateColumn()
    public updatedAt: Date;

    @Column({
        unique: true,
        nullable: false,
        name: "userId"
    })
    public name: string;

    @Column({
        unique: true,
        nullable: false,
        name: "token"
    })
    public value: string;

}
