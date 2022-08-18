import {IIdentifiable} from "./IIdentifiable.js";
import {Column} from "typeorm";
import {AbstractModel} from "./AbstractModel.js";

export class IdentifiableModel extends AbstractModel implements IIdentifiable {
    @Column({
        unique: false,
        nullable: false
    })
    public userId: string;
}
