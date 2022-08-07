import {IdentifiableModel} from "../IdentifiableModel";
import {Column, Entity, Unique} from "typeorm";

@Entity()
@Unique("BirthdayConstraint", ["userId", "guildId"])
export class BirthdaysModel extends IdentifiableModel {

    @Column({nullable: false})
    public birthday: number;

    @Column({nullable: false})
    public dayOfYear: number;

    @Column({nullable: false})
    public includeYear: boolean;
}