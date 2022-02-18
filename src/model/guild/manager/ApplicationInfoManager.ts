import {singleton} from "tsyringe";
import * as pack from '../../../../package.json';
import {Client} from "discordx";

export type GuildInfo = {
    name: string,
    id: string,
    memberCount: number,
    createdDate: number
}

export type DevInfo = {
    repoUrl: string,
    email: string,
    discordHandle: string,
    name?: string
}

@singleton()
export class ApplicationInfoManager {

    public constructor(private _client: Client) {
    }

    public async getGuildInfo(guildId: string): Promise<GuildInfo> {
        const guild = await this._client.guilds.fetch(guildId);
        const guildInfo = {
            name: guild.name,
            id: guild.id,
            memberCount: guild.memberCount,
            createdDate: Math.ceil(guild.createdTimestamp / 1000)
        };
        return guildInfo;
    }

    public get devInfo(): DevInfo {
        const info: DevInfo = {
            email: process.env.email,
            discordHandle: process.env.discord_handle,
            repoUrl: pack.repository.url
        };
        if (process.env.name_of_dev) {
            info["name"] = process.env.name_of_dev;
        }
        return info;
    }

    public get inviteUrl(): string | undefined {
        return process.env.invite_url;
    }

    public get guildsJoined(): number {
        return this._client.guilds.cache.size;
    }

    public get sumOfAllGuilds(): number {
        let retNum = 0;
        for (const [, guild] of this._client.guilds.cache) {
            retNum += guild.memberCount;
        }
        return retNum;
    }
}