import type {IIdentifiable} from "./IIdentifiable";
import {Column} from "typeorm";
import {AbstractModel} from "./AbstractModel";

export class IdentifiableModel extends AbstractModel implements IIdentifiable {
    @Column({
        unique: false,
        nullable: false
    })
    public userId: string;
}