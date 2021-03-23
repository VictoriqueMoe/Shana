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
}