import {Entity, JoinColumn, ManyToOne} from "typeorm";
import {GuildableModel} from "./Guildable.model.js";
import {AbstractModel} from "../AbstractModel.js";

@Entity()
export class TwitterModel extends AbstractModel {

    @ManyToOne(() => GuildableModel, guildableModel => guildableModel.twitterModel, AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    guildableModel: GuildableModel;

}