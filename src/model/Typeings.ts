import SETTINGS from "../enums/SETTINGS.js";
import type {ArgsOf, Awaitable, Client} from "discordx";
import type {CategoryChannel, HexColorString, Message, TextChannel} from "discord.js";
import {
    Attachment,
    AttachmentBuilder,
    AttachmentPayload,
    BufferResolvable,
    ThreadAutoArchiveDuration
} from "discord.js";
import {Stream} from "node:stream";
import {JSONEncodable} from "@discordjs/builders";
import {APIAttachment} from "discord-api-types/v10.js";

export namespace Typeings {
    export type propTypes = envTypes & packageJsonTypes
    export type envTypes = {
        TOKEN: string;
        TEST_TOKEN: string;
        DROPBOX_TOKEN: string;
        CLEVERBOT_KEY: string;
        DEEPAPI: string;
        DEEPL: string;
        DANBOORU_API_KEY: string;
        DANBOORU_API_USER: string;
        OCR_LOC: string;
        RAPID_API_CODE: string;
        NODE_ENV: "production" | "development"
    };

    type packageJsonTypes = {
        "name"?: string,
        "version"?: string,
        "description"?: string,
        "type"?: string,
        "main"?: string,
        "scripts"?: { [key: string]: string },
        "repository"?: {
            "type"?: string,
            "url"?: string
        },
        "author"?: string,
        "license"?: string,
        "bugs"?: {
            "url"?: string
        },
        "dependencies"?: { [key: string]: string },
        "homepage"?: string,
        "devDependencies"?: { [key: string]: string }
    }

    export type UpdateCommandSettings = {
        roles: string[],
        enabled: boolean
    };

    export type ObjectChange<T> = {
        before: T,
        after: T
    };


    export namespace SETTINGS_RESOLVER {
        export enum AutoRoleSettingsEnum {
            "ROLE" = "Role",
            "AUTO_MUTE" = "autoMute",
            "AUTO_JAIL" = "autoJail",
            "PANIC_MODE" = "panicMode",
            "MIN_ACCOUNT_AGE" = "minAccountAge",
            "MASS_JOIN_PROTECTION" = "massJoinProtection"
        }

        export const CombinedSettings = {...SETTINGS, ...AutoRoleSettingsEnum};
        export type CombinedSettings = keyof typeof CombinedSettings;
    }

    export namespace MoebooruTypes {
        export enum EXPLICIT_RATING {
            "safe" = "s",
            "general" = "g",
            "sensitive" = "s",
            "questionable" = "q",
            "explicit" = "e"
        }

        export type MoebooruResponse = MoebooruImage[];

        export type DanbooruTag = LoliBooruTag;
        export type KonachanTag = MoebooruTag & {
            "count"?: number
        };
        export type LoliBooruTag = MoebooruTag & {
            "post_count"?: number
        };
        export type MoebooruTag = {
            "id"?: number,
            "name": string,
            "type"?: number,
            "ambiguous"?: boolean
        };
        export type MoebooruImage = {
            "id": number,
            "tags": string,
            "created_at": number,
            "creator_id": number,
            "author": string,
            "change": number,
            "source": string,
            "score": number,
            "md5": string,
            "file_size": number,
            "file_url": string,
            "is_shown_in_index": boolean,
            "preview_url": string,
            "preview_file_url": string,
            "preview_width": number,
            "preview_height": number,
            "actual_preview_width": number,
            "actual_preview_height": number,
            "sample_url": string,
            "sample_width": number,
            "sample_height": number,
            "sample_file_size": number,
            "jpeg_url": string,
            "jpeg_width": number,
            "jpeg_height": number,
            "jpeg_file_size": number,
            "rating": EXPLICIT_RATING,
            "has_children": boolean,
            "parent_id": number,
            "status": string,
            "width": number,
            "height": number,
            "is_held": boolean,
            "frames_pending_string": string,
            "frames_string": string
        }
    }

    export type AutoResponderPayload = {
        title: string,
        responseType: "message" | "reaction" | "delete",
        wildCard?: boolean,
        response?: string,
        emojiReactions?: string[],
        guildId: string,
        publicDeletre: boolean,
        useRegex: boolean
    } & EventSecurityConstraintType;
    export type EventSecurityConstraintType = {
        allowedChannels?: string[],
        allowedRoles?: string[],
        ignoredChannels?: string[],
        ignoredRoles?: string[],
    }

    export type EditType = ([message]: ArgsOf<"messageCreate">, client: Client, guardPayload: any, isUpdate: boolean) => Promise<void>;
    export type EventTriggerCondition = (message: Message) => Awaitable<boolean>;

    export type EmojiInfo = {
        "buffer"?: Buffer,
        "url": string,
        "id": string
    };

    export type StickerInfo = EmojiInfo;


    export type RoleChange = {
        permissions?: ObjectChange<Array<string>>
        nameChange?: ObjectChange<string>,
        colourChange?: ObjectChange<HexColorString>,
        iconChange?: ObjectChange<string>,
        hoist?: ObjectChange<boolean>
    };

    export type ChannelUpdate = {
        name?: ObjectChange<string>,
        topic?: ObjectChange<string>,
        slowMode?: ObjectChange<number>,
        nsfw?: ObjectChange<boolean>,
        parent?: ObjectChange<CategoryChannel>
    };


    export type GuildUpdate = {
        banner?: ObjectChange<string>,
        rulesChannel?: ObjectChange<TextChannel>,
        splash?: ObjectChange<string>,
        description?: ObjectChange<string>,
        discoverySplash?: ObjectChange<string>,
        icon?: ObjectChange<string>,
        vanityURLCode?: ObjectChange<string>,
        name?: ObjectChange<string>,

    };

    export type ThreadUpdate = {
        archived?: ObjectChange<boolean>,
        type?: ObjectChange<"Public" | "Private" | null>
        locked?: ObjectChange<boolean>,
        name?: ObjectChange<string>,
        slowMode?: ObjectChange<number>,
        archiveDuration?: ObjectChange<ThreadAutoArchiveDuration | null>
    };

    export type MemberUpdate = {
        nickName?: ObjectChange<string>,
        timeout?: ObjectChange<number>
    }

    export type FileResolvable = (BufferResolvable
        | Stream
        | JSONEncodable<APIAttachment>
        | Attachment
        | AttachmentBuilder
        | AttachmentPayload) [];
}
