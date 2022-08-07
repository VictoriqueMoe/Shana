import {IGuildAware} from "../IGuildAware";
import {RolePersistenceModel} from "../autoMod/impl/RolePersistence.model";
import {UsernameModel} from "../autoMod/impl/Username.model";
import {CloseOptionModel} from "../autoMod/impl/CloseOption.model";
import {BannedAttachmentsModel} from "./BannedAttachments.model";
import {SettingsModel} from "./Settings.model";
import {PostableChannelModel} from "./PostableChannel.model";
import {AutoResponderModel} from "../autoMod/impl/AutoResponder.model";
import {RoleJoinerModel} from "./RoleJoiner.model";
import {BookmarkModel} from "./Bookmark.model";
import {MessageScheduleModel} from "./MessageSchedule.model";
import {TwitterModel} from "./Twitter.model";
import {Column, Entity, OneToMany} from "typeorm";

@Entity()
export class GuildableModel implements IGuildAware {

    @Column({
        primary: true
    })
    public guildId: string;

    @OneToMany(() => RolePersistenceModel, rolePersistence => rolePersistence.guildableModel)
    public rolePersistence: RolePersistenceModel[];

    @OneToMany(() => UsernameModel, usernameModel => usernameModel.guildableModel)
    public usernameModel: UsernameModel[];

    @OneToMany(() => CloseOptionModel, closeOptionModel => closeOptionModel.guildableModel)
    public closeOptionModel: CloseOptionModel[];

    @OneToMany(() => BannedAttachmentsModel, bannedAttachmentsModel => bannedAttachmentsModel.guildableModel)
    public bannedAttachmentsModel: BannedAttachmentsModel[];

    @OneToMany(() => SettingsModel, settingsModel => settingsModel.guildableModel)
    public settingsModel: SettingsModel[];

    @OneToMany(() => PostableChannelModel, postableChannels => postableChannels.guildableModel)
    public postableChannels: PostableChannelModel[];

    @OneToMany(() => AutoResponderModel, autoResponderModel => autoResponderModel.guildableModel)
    public autoResponderModel: AutoResponderModel[];

    @OneToMany(() => RoleJoinerModel, roleJoinerModel => roleJoinerModel.guildableModel)
    public roleJoinerModel: RoleJoinerModel[];

    @OneToMany(() => BookmarkModel, bookmarkModel => bookmarkModel.guildableModel)
    public bookmarkModel: BookmarkModel[];

    @OneToMany(() => MessageScheduleModel, messageScheduleModel => messageScheduleModel.guildableModel)
    public messageScheduleModel: MessageScheduleModel[];

    @OneToMany(() => TwitterModel, twitterModel => twitterModel.guildableModel)
    public twitterModel: TwitterModel[];
}
