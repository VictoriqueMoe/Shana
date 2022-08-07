import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";
import {GuildableModel} from "./Guildable.model";
import {IdentifiableModel} from "../IdentifiableModel";
import {AbstractModel} from "../AbstractModel";

@Entity()
export class BookmarkModel extends IdentifiableModel {

    @Column({
        type: "simple-array",
        nullable: false
    })
    public messageIds: string[];

    @ManyToOne(() => GuildableModel, guildableModel => guildableModel.bookmarkModel, AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    public guildableModel: GuildableModel;
}
