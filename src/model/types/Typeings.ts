import {ArgsOf, Client} from "discordx";
import {GuildChannel, Message, ThreadChannel} from "discord.js";

export namespace Typeings {
    export type CommandArgs = {
        module: {
            name: string,
            description: string
        },
        commands: Command[]
    };
    export type Command = {
        name: string,
        deprecated?: boolean,
        description?: {
            text?: string,
            examples?: string[],
            args?: {
                name: string,
                type: "mention" | "text" | "number" | "boolean" | "attachment",
                optional: boolean,
                description: string
            }[]
        }
    };
    export type AbstractChannel = GuildChannel | ThreadChannel;

    export type UpdateCommandSettings = {
        roles: string[],
        enabled: boolean
    };

    export type AnimeEntry = {
        averageScore: number,
        coverImage: {
            large: string,
            medium: string,
            small: string,
            color: string
        },
        description: string,
        startDate: PseudoDate,
        endDate: PseudoDate,
        episodes: number,
        siteUrl: string,
        format: string,
        genres: string[],
        isAdult: boolean,
        nextAiringEpisode: AiringEntry[]
    }
    export type PseudoDate = {
        year: number,
        month: number,
        day: number
    };
    export type AiringEntry = {
        airingAt: number,
        episode: number
    }

    export namespace DEEP_AI {
        type MainOb = {
            id: string,
        }
        export type SenimentTypes = "very negative" | "negative" | "neutral" | "positive" | "very positive";
        export type SentimentAnalysisResponse =
            MainOb
            & { output: [SenimentTypes] };
        export type ImageSimilarity = MainOb & {
            output: {
                distance: number
            }
        };
        export type TextGeneration = MainOb & {
            output: string
        };
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

export type EditType = ([message]: ArgsOf<"message">, client: Client, guardPayload: any, isUpdate: boolean) => Promise<void>;
export type EventTriggerCondition = (message: Message) => Promise<boolean>;