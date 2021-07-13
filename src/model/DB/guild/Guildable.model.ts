import {Column, HasMany, Model, Table} from "sequelize-typescript";
import {IGuildAware} from "../IGuildAware";
import {MuteModel} from "../autoMod/impl/Mute.model";
import {RolePersistenceModel} from "../autoMod/impl/RolePersistence.model";
import {UsernameModel} from "../autoMod/impl/Username.model";
import {CloseOptionModel} from "../autoMod/impl/CloseOption.model";
import {BannedAttachmentsModel} from "../BannedAttachments.model";
import {SettingsModel} from "../Settings.model";
import {PostableChannelModel} from "./PostableChannel.model";
import {CommandSecurityModel} from "./CommandSecurity.model";
import {AutoResponderModel} from "../autoMod/impl/AutoResponder.model";

@Table
export class GuildableModel extends Model implements IGuildAware {

    @Column({primaryKey: true})
    public guildId: string;

    @HasMany(() => MuteModel)
    public muteModel: MuteModel[];

    @HasMany(() => RolePersistenceModel)
    public rolePersistenc: RolePersistenceModel[];

    @HasMany(() => UsernameModel)
    public usernameModel: UsernameModel[];

    @HasMany(() => CloseOptionModel)
    public closeOptionModel: CloseOptionModel[];

    @HasMany(() => BannedAttachmentsModel)
    public bannedAttachmentsModel: BannedAttachmentsModel[];

    @HasMany(() => SettingsModel)
    public settingsModel: SettingsModel[];

    @HasMany(() => PostableChannelModel)
    public postableChannels: PostableChannelModel[];

    @HasMany(() => CommandSecurityModel)
    public commandSecurityModel: CommandSecurityModel[];

    @HasMany(() => AutoResponderModel)
    public autoResponderModel: AutoResponderModel[];
    /*
        @HasMany(() => SubModuleModel)
        public subModuleModel: SubModuleModel[];*/
}