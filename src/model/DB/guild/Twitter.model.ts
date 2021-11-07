import {Entity, JoinColumn, ManyToOne} from "typeorm";
import {GuildableModel} from "./Guildable.model";
import {AbstractModel} from "../AbstractModel";

@Entity()
export class TwitterModel extends AbstractModel {

    @ManyToOne(() => GuildableModel, guildableModel => guildableModel.twitterModel, AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    guildableModel: GuildableModel;

}