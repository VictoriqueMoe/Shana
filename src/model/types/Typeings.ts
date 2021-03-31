export namespace Typeings {
    export type CommandArgs = {
        module:{
            name:string,
            description:string
        },
        commands: Command[]
    };
    export type Command = {
        name: string,
        depricated?: boolean,
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
}