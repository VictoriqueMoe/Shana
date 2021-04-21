import {Controller, Get} from "@overnightjs/core";
import {Request, Response} from 'express';
import {Main} from "../../../Main";
import {AbstractController} from "../AbstractController";
import {DiscordUtils, ObjectUtil} from "../../../utils/Utils";
import {Channel, Guild, GuildMember} from "discord.js";
import {StatusCodes} from "http-status-codes";

@Controller("api/bot")
export class BotController extends AbstractController {

    @Get('allGuilds')
    private async getAllGuilds(req: Request, res: Response) {
        const guilds = Main.client.guilds.cache;
        const obj = {};
        for (const [guildId, guild] of guilds) {
            obj[guildId] = guild.toJSON();
        }
        return super.ok(res, obj);
    }

    @Get('getChannel')
    private async getChannel(req: Request, res: Response) {
        try {
            const guild = await this.getGuild(req);
            const channel = await this.getChannelObject(req, guild);
            return super.ok(res, channel.toJSON());
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.NOT_FOUND);
        }
    }


    @Get('getGuild')
    private async getGuildFromId(req: Request, res: Response) {
        try {
            const guild = await this.getGuild(req);
            return super.ok(res, guild.toJSON());
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.NOT_FOUND);
        }
    }

    private async getGuild(req: Request): Promise<Guild> {
        const id = req.query.id as string;
        if (!ObjectUtil.validString(id)) {
            throw new Error("Please supply an ID");
        }
        let guild: Guild = null;
        let guildFound: boolean;
        try {
            guild = await Main.client.guilds.fetch(id);
            guildFound = true;
        } catch {
            guildFound = false;
        }
        if (!guildFound) {
            throw new Error(`Guild with ID: ${id} not found`);
        }
        return guild;
    }

    private async getChannelObject(req: Request, guild: Guild): Promise<Channel> {
        const id = req.query.channelId as string;
        if (!ObjectUtil.validString(id)) {
            throw new Error("Please supply an ID");
        }
        let channel: Channel;
        try {
            channel = await guild.channels.resolve(id);
        } catch {
            throw new Error(`Channel with ID: ${id} not found`);
        }
        return channel;
    }

    @Get('getBotInfo')
    private async getBotInfo(req: Request, res: Response) {
        const bot = Main.client.user;
        if (!bot) {
            return super.doError(res, "Unable to fdind client", StatusCodes.INTERNAL_SERVER_ERROR);
        }
        const id = req.query.id as string;
        let guild: Guild = null;
        let botMemeber: GuildMember;
        try {
            guild = await this.getGuild(req);
            botMemeber = await guild.members.fetch(bot);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.NOT_FOUND);
        }
        return super.ok(res, botMemeber.toJSON());
    }


    @Get('getEmojis')
    private async getEmojis(req: Request, res: Response) {
        let guild: Guild = null;
        try {
            guild = await this.getGuild(req);
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.NOT_FOUND);
        }
        const emojiManager = guild.emojis;
        const pArr = emojiManager.cache.array().map(emoji => DiscordUtils.getEmojiInfo(emoji.id));
        const emojis = await Promise.all(pArr).then(values => {
            return values.map(v => {
                return {
                    "buffer": v.buffer.toString("base64"),
                    "url": v.url,
                    "id": v.id
                };
            });
        });
        return super.ok(res, emojis);
    }
}
