import {GuildUtils} from "../../../../utils/Utils";
import {GuildableModel} from "../../guild/Guildable.model";
import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";
import {AbstractModel} from "../../AbstractModel";
import {IdentifiableModel} from "../../IdentifiableModel";

@Entity()
export class MuteModel extends IdentifiableModel {

    @Column({
        type: "simple-array",
        nullable: false
    })
    public prevRole: string[];

    @Column({nullable: false})
    public username: string;

    @Column({
        type: "text"
    })
    public reason: string;

    @Column()
    public creatorID: string;

    @Column({
        nullable: false,
        default: 0,
        type: "integer"
    })
    public violationRules: number;

    @Column({
        nullable: true,
        type: "integer"
    })
    public timeout: number;

    @ManyToOne(() => GuildableModel, guildableModel => guildableModel.muteModel, AbstractModel.cascadeOps)
    @JoinColumn({name: AbstractModel.joinCol})
    public guildableModel: GuildableModel;

    public async getPrevRoles(): Promise<string[]> {
        const prevRoles = this.prevRole;
        const newArr: string[] = [];
        for (const prevRole of prevRoles) {
            if (await GuildUtils.RoleUtils.isValidRole(this.guildId, prevRole)) {
                newArr.push(prevRole);
            }
        }
        return newArr;
    }
}