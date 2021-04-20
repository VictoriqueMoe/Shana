import {Controller, Get} from "@overnightjs/core";
import {Request, Response} from 'express';
import {Main} from "../../../Main";
import {AbstractController} from "../AbstractController";
import {DiscordUtils, ObjectUtil} from "../../../utils/Utils";
import {Guild} from "discord.js";
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


    @Get('getGuild')
    private async getGuildFromId(req: Request, res: Response) {
        try {
            const guild = await this.getGuild(req, res);
            return super.ok(res, guild.toJSON());
        } catch (e) {
            return super.doError(res, e.message, StatusCodes.NOT_FOUND);
        }
    }

    private async getGuild(req: Request, res: Response): Promise<Guild> {
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


    @Get('getEmojis')
    private async getEmojis(req: Request, res: Response) {
        let guild: Guild = null;
        try {
            guild = await this.getGuild(req, res);
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
