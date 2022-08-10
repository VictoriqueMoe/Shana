import {IGuildAware} from "../IGuildAware.js";
import {RolePersistenceModel} from "../autoMod/impl/RolePersistence.model.js";
import {UsernameModel} from "../autoMod/impl/Username.model.js";
import {CloseOptionModel} from "../autoMod/impl/CloseOption.model.js";
import {BannedAttachmentsModel} from "./BannedAttachments.model.js";
import {SettingsModel} from "./Settings.model.js";
import {PostableChannelModel} from "./PostableChannel.model.js";
import {AutoResponderModel} from "../autoMod/impl/AutoResponder.model.js";
import {RoleJoinerModel} from "./RoleJoiner.model.js";
import {BookmarkModel} from "./Bookmark.model.js";
import {MessageScheduleModel} from "./MessageSchedule.model.js";
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
}
