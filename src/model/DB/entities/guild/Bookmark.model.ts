import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";
import type {GuildableModel} from "./Guildable.model.js";
import {IdentifiableModel} from "../IdentifiableModel.js";
import {AbstractModel} from "../AbstractModel.js";

@Entity()
export class BookmarkModel extends IdentifiableModel {

    @Column({
        type: "simple-array",
        nullable: false
    })
    public messageIds: string[];

    @ManyToOne("GuildableModel", "bookmarkModel", AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    public guildableModel: GuildableModel;
}
