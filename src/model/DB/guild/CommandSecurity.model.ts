import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";
import {GuildableModel} from "./Guildable.model";
import {AbstractModel} from "../AbstractModel";

@Entity()
export class CommandSecurityModel extends AbstractModel {

    @Column({unique: false, nullable: false})
    public commandName: string;

    @Column({unique: false, default: true})
    public enabled: boolean;

    @Column({
        type: "simple-array",
    })
    public allowedRoles: string[];

    @ManyToOne(() => GuildableModel, guildableModel => guildableModel.commandSecurityModel, AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    guildableModel: GuildableModel;
}