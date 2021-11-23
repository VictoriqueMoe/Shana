import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";
import {GuildableModel} from "./Guildable.model.js";
import {IdentifiableModel} from "../IdentifiableModel.js";
import {AbstractModel} from "../AbstractModel.js";

@Entity()
export class BookmarkModel extends IdentifiableModel {

    @Column({
        type: "simple-array",
        nullable: false
    })
    public messageIds: string[];

    @ManyToOne(() => GuildableModel, guildableModel => guildableModel.bookmarkModel, AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    guildableModel: GuildableModel;
}