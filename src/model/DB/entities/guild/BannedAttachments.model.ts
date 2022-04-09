import {GuildableModel} from "./Guildable.model";
import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";
import {AbstractModel} from "../AbstractModel";

@Entity()
export class BannedAttachmentsModel extends AbstractModel {

    @Column({unique: false})
    public attachmentHash: string;

    @Column()
    public url: string;

    @Column()
    public reason: string;

    @Column({default: false})
    public isEmoji: boolean;

    @Column({default: false})
    public isSticker: boolean;


    @ManyToOne(() => GuildableModel, guildableModel => guildableModel.bannedAttachmentsModel, AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    guildableModel: GuildableModel;
}