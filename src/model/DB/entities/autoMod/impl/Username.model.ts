import {GuildableModel} from "../../guild/Guildable.model";
import {IdentifiableModel} from "../../IdentifiableModel";
import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";
import {AbstractModel} from "../../AbstractModel";

@Entity()
export class UsernameModel extends IdentifiableModel {

    @Column()
    public usernameToPersist: string;

    @Column({
        default: false
    })
    public force: boolean;

    @ManyToOne(() => GuildableModel, guildableModel => guildableModel.usernameModel, AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    public guildableModel: GuildableModel;

}