import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";
import {GuildableModel} from "../../guild/Guildable.model";
import {AbstractEventSecurityConstraint} from "../../AbstractEventSecurityConstraint";
import {AbstractModel} from "../../AbstractModel";

@Entity()
export class AutoResponderModel extends AbstractEventSecurityConstraint {

    @Column({nullable: false, default: false})
    public useRegex: boolean;

    @Column({nullable: false, unique: true})
    public title: string;

    @Column({enum: ["message", "reaction", "delete", "kick"], type: "text", default: "message", nullable: false})
    public responseType: "message" | "reaction" | "delete" | "kick";

    @Column({default: false, nullable: false})
    public wildCard: boolean;

    @Column({default: false, nullable: false})
    public publicDelete: boolean;

    @Column({type: "text", nullable: true, default: null})
    public response: string;

    @Column({type: "boolean", default: false})
    public useOCR: boolean;

    @Column({
        type: "simple-array",
        nullable: false,
        default: ""
    })
    public emojiReactions: string[];

    @ManyToOne(() => GuildableModel, guildableModel => guildableModel.autoResponderModel, AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    public guildableModel: GuildableModel;
}
