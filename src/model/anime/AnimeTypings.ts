export interface Response {
    RawDocsCount: number;
    CacheHit: boolean;
    trial: number;
    limit: number;
    limit_ttl: number;
    quota: number;
    quota_ttl: number;
    RawDocsSearchTime: number;
    ReRankSearchTime: number;
    docs: Doc[];
}

export interface Doc {
    filename: string;
    episode?: number;
    from: number;
    to: number;
    similarity: number;
    anilist_id: number;
    anime: string;
    at: number;
    is_adult: boolean;
    mal_id: number;
    season: string;
    title: string;
    title_chinese: string;
    title_english?: string;
    title_native: string;
    title_romaji: string;
    tokenthumb: string;
}