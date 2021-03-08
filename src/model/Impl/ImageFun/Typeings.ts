export type GenerateEndPointRequest = {
    endPoint: GENERATE_ENDPOINT,
    "Body_Params": {
        "url": string,
        additional?: additionalGenGetArgs
    }
}
export type additionalGenGetArgs = {
    "twitter"?: {
        "avatar1": string,
        "avatar2": string,
        "avatar3": string,
        "text": string
    },
    "vs"?: {
        "type"?: 1 | 2 | 3,
        avatar: string
    },
    "blur"?: {
        "blur"?: number
    },
    "blurple"?: invert,
    "redple"?: invert,
    "greyple"?: invert,
    "pixelize"?: {
        pixelize: number
    },
    "steamcard"?: {
        "text": string
    },
    "trinity"?: {
        type: "1" | "2"
    }
    "symmetry"?: {
        orientation: orientation
    },
    "whowouldwin"?: avatar,
    "afusion"?: avatar,
    "batslap"?: avatar,
    "facebook"?: {
        "text"?: string
    },
    "triggered"?: {
        blur?: boolean,
        greyscale?: boolean,
        horizontal?: boolean,
        invert?: boolean,
        sepia?: boolean,
        vertical?: boolean,
    }
}
export type avatar = {
    "avatar": string
}

type invert = {
    "invert"?: boolean
}

export type orientation = "left-right" |
    "right-left" |
    "top-bottom" |
    "bottom-top" |
    "top-left" |
    "top-right" |
    "bottom-left" |
    "bottom-right"


export type ImageEndPointRequest = {
    endPoint: image_endpoint,
    Headers: {
        "Authorization": string
    }
}
export type GenerateEndPointResponse = Buffer

export type ImageEndPointResponse = {
    "status": number,
    "url": string
}

export type GenerateEndPointGetAllResponse = {
    "status": number,
    "message": string,
    "endpoints": {
        "free": GENERATE_ENDPOINT[]
    }
}

export type ImageEndPointGetAllResponse = {
    "endpoints": {
        "free": image_endpoint[]
    }
}

export enum image_endpoint {
    "wallpaper" = "wallpaper"
}

export enum GENERATE_ENDPOINT {
    "3000years" = "3000years",
    "afusion" = "afusion",
    "approved" = "approved",
    "batslap" = "batslap",
    "badge" = "badge",
    "beautiful" = "beautiful",
    "blur" = "blur",
    "blurple" = "blurple",
    "bobross" = "bobross",
    "brazzers" = "brazzers",
    "burn" = "burn",
    "captcha" = "captcha",
    "challenger" = "challenger",
    "changemymind" = "changemymind",
    "circle" = "circle",
    "contrast" = "contrast",
    "crush" = "crush",
    "ddungeon" = "ddungeon",
    "deepfry" = "deepfry",
    "dictator" = "dictator",
    "dither565" = "dither565",
    "discordhouse" = "discordhouse",
    "distort" = "distort",
    "emboss" = "emboss",
    "facebook" = "facebook",
    "fakemessage" = "fakemessage",
    "fire" = "fire",
    "frame" = "frame",
    "gay" = "gay",
    "glitch" = "glitch",
    "greyple" = "greyple",
    "greyscale" = "greyscale",
    "invert" = "invert",
    "instagram" = "instagram",
    "jail" = "jail",
    "lookwhatkarenhave" = "lookwhatkarenhave",
    "magik" = "magik",
    "missionpassed" = "missionpassed",
    "moustache" = "moustache",
    "ph" = "ph",
    "pixelize" = "pixelize",
    "pornhub" = "pornhub",
    "posterize" = "posterize",
    "ps4" = "ps4",
    "redple" = "redple",
    "rejected" = "rejected",
    "rip" = "rip",
    "scary" = "scary",
    "sepia" = "sepia",
    "sharpen" = "sharpen",
    "silhouette" = "silhouette",
    "sniper" = "sniper",
    "steamcard" = "steamcard",
    "steamnowplaying" = "steamnowplaying",
    "subzero" = "subzero",
    "symmetry" = "symmetry",
    "thanos" = "thanos",
    "thesearch" = "thesearch",
    "tobecontinued" = "tobecontinued",
    "triggered" = "triggered",
    "trinity" = "trinity",
    "truth" = "truth",
    "twitter" = "twitter",
    "unsharpen" = "unsharpen",
    "utatoo" = "utatoo",
    "vs" = "vs",
    "waifu" = "waifu",
    "walden" = "walden",
    "wanted" = "wanted",
    "wasted" = "wasted",
    "worthless" = "worthless",
    "whowouldwin" = "whowouldwin"
}