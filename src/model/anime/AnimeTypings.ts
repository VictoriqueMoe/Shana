export interface Response {
    frameCount: number,
    error: string,
    result: AnimeResult[]
}

export interface AnimeResult {
    anilist: number,
    "filename": string
    "episode": number,
    "from": number,
    "to": number,
    "similarity": number
    "video": string,
    "image": string
}