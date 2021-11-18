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