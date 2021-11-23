import {GuildableModel} from "./Guildable.model.js";
import typeorm from "typeorm";
const { Column, Entity, JoinColumn, ManyToOne } = typeorm;
import {AbstractModel} from "../AbstractModel.js";

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