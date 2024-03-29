import type {GuildableModel} from "../../guild/Guildable.model.js";
import {IdentifiableModel} from "../../IdentifiableModel.js";
import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";
import {AbstractModel} from "../../AbstractModel.js";

@Entity()
export class UsernameModel extends IdentifiableModel {

    @Column()
    public usernameToPersist: string;

    @Column({
        default: false
    })
    public force: boolean;

    @ManyToOne("GuildableModel", "usernameModel", AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    public guildableModel: GuildableModel;

}
