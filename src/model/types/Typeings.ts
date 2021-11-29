import {ArgsOf, Client} from "discordx";
import {Message} from "discord.js";
import {SETTINGS} from "../../enums/SETTINGS";

export namespace Typeings {
    export type UpdateCommandSettings = {
        roles: string[],
        enabled: boolean
    };

    export namespace DEEP_AI {
        type MainOb = {
            id: string,
        }
        export type SenimentTypes = "very negative" | "negative" | "neutral" | "positive" | "very positive";
        export type SentimentAnalysisResponse =
            MainOb
            & { output: SenimentTypes[] };
        export type ImageSimilarity = MainOb & {
            output: {
                distance: number
            }
        };
        export type TextGeneration = MainOb & {
            output: string
        };
    }
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
            "questionable" = "q",
            "explicit" = "e"
        }

        export type MoebooruResponse = MoebooruImage[];

        export type KonachanTag = MoebooruTag & {
            "count"?: number
        }
        export type LoliBooruTag = MoebooruTag & {
            "post_count"?: number
        }
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
export type EventTriggerCondition = (message: Message) => Promise<boolean>;